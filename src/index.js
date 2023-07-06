import inum from "inum";
import ObjectLive from "object-live";
import {getPropertyByPath, setPropertyByPath} from "objectutils-propertybypath";

const RP = class extends HTMLElement {
	model;
	logic;
	#modelChangeHandlers = {};

	constructor(tree, modelData, logic) {
		super();
		this.model = modelData instanceof ObjectLive ? modelData : new ObjectLive(modelData);
		this.logic = logic || {};

		//console.log('RPNode:', this);
		//console.log('tree:', tree);
		//console.log('logic:', logic);

		this.#treeRender(this, tree.vDom.tree);

		Object.entries(this.#modelChangeHandlers).forEach(([path, handlers]) => {
			//console.warn('subscribe:', path);
			let renderPath = (cfg) => {
				//console.log();
				//console.log('model change:', path);
				handlers.forEach(handler => handler(cfg));
			}
			this.model.addEventListener("change", path, renderPath);

			if (path.indexOf('.') !== -1) {	//Если в пути есть точка, то может родитель измениться. Подписываемся на изменение родителя
				let rootPath = path.split('.')[0];		//TODO: нужно рекурсивно всех перебирать
				this.model.addEventListener("change", rootPath, renderPath);
			}
		});
	}

	logicSet(logic) {
		this.logic = logic;
	}

	#modelChangeHandlersAdd(path, handler) {
		if (!this.#modelChangeHandlers[path]) {
			this.#modelChangeHandlers[path] = [];
		}
		this.#modelChangeHandlers[path].push(handler);
	}

	#treeRender(root, tree) {
		const nodeConstructors = {
			textNode: (params) => {
				let value = params.value !== undefined && params.value !== null ? params.value : '';
				const node = document.createTextNode(value);
				if (params.modelDepends) {
					params.modelDepends.forEach(dep => {
						if (dep.refName === 'm') {
							const render = () => {
								try {
									node.textContent = (new Function('self, model',
										'const m = model;' +
										'return ' + params.valueOutRender + ';'
									))(this.logic, this.model.data);
								} catch (e) {}
							}
							this.#modelChangeHandlersAdd(dep.modelPath, render);
							render();
						}
					});
				}
				return node;
			},

			splitNode: () => {
				return document.createComment('-');
			},

			tag: (params) => {
				const node = document.createElement(params.tagName);
				//console.warn('node:', node);
				//console.warn('params:', params);
				if (params.attrs) {
					Object.entries(params.attrs).forEach(([attrName, attrCfg]) => {
						if (attrCfg.type === "event") {
							node[attrName] = event => {
								(new Function('self, model, event',
									'const m = model, e=event;' +
									'return ' + attrCfg.fn + ';'
								))(this.logic, this.model.data, event);
							}
						} else {
							let attrNode = document.createAttribute(attrName);
							if (attrCfg.modelDepends) {
								//console.log('dynamic attr:', attrNode, attrName, attrCfg, params);

								attrCfg.modelDepends.forEach(dep => {
									if (dep.refName === 'm') {
										let render;

										if (params.tagName === 'input' && attrName === 'value') {
											const initiator = 'input.' + inum();
											render = (cfg) => {
												if (!(cfg && cfg.extra && cfg.extra.initiator && cfg.extra.initiator === initiator)) {
													//console.warn('changeCfg:', cfg.extra.initiator, initiator);
													node.value = (new Function('self, model',
														'const m = model;' +
														'return ' + attrCfg.valueOutRender + ';'
													))(this.logic, this.model.data);
												}
											};
											node.addEventListener('input', (e) => {
												setPropertyByPath(this.model.data, attrCfg.modelOut[0].modelPath, {
													_RP_MODEL_: true,
													value: node.value,
													extra: {initiator: initiator}
												});
											});
										} else {
											render = () => {
												try {
													attrNode.value = (new Function('self, model',
														'const m = model, e=event;' +
														'return ' + attrCfg.valueOutRender + ';'
													))(this.logic, this.model.data);
												} catch (e) {}
											};
										}
										this.#modelChangeHandlersAdd(dep.modelPath, render);
										render();

									}
								});
							} else {
								attrNode.value = attrCfg.value;
							}
							node.setAttributeNode(attrNode);
						}
						//this.attrs[attrCfg.apid] = attrNode;
					});
				}

				if (params.childNodes) {
					this.#treeRender(node, params.childNodes);
				}
				return node;
			},

			component: (params) => {
				let node;
				//console.log('create component:', params);
				let tagClass = customElements.get(params.tagName);
				if (tagClass) {
					let model = new ObjectLive({});
					//console.log('[rp] model:', model);

					Object.entries(params.attrs).forEach(([attrName, attrCfg]) => {
						//console.log('[rp] bind attr:', attrName, attrCfg);
						if (attrCfg.type === 'string') {
							//TODO:
						} else if (attrCfg.type === 'json') {
							if (attrCfg.modelDepends) {
								attrCfg.modelDepends.forEach(dep => {
									//console.log('[rp] model:', this.model, 'attrName:',attrName, 'dep:', dep, 'attrCfg:', attrCfg);

									let curValue = getPropertyByPath(this.model.data, dep.modelPath);
									model.data[attrName] = curValue;
									//console.log('curValue:', curValue);
									//console.log('new:', model.data[attrName]);

									//Если наша модель изменилось - меняем в компоненте
									if (dep.refName === 'm') {
										if (!this.#modelChangeHandlers[dep.modelPath]) {
											this.#modelChangeHandlers[dep.modelPath] = [];
										}
										this.#modelChangeHandlers[dep.modelPath].push((value) => {
											//TODO: use inRender
										});
									}
								});

								//Бриджим свою модель с моделью компонента
								attrCfg.modelDepends.forEach(dep => {
									if (dep.refName === 'm') {
										if (!dep.jsonInnerPath) {
											this.model.bridgeChanges(dep.modelPath, model, attrName);
										}
									}
								});
							} else {
								//model.data[attrName] = curValue;
							}
						}
					});
					node = new tagClass(model);

					if (params.childNodes) {
						this.#treeRender(node, params.childNodes);
					}

					//console.warn('component:', node);
				} else {
					console.warn("Component used, but not exist: " + params.tagName, '; Render as tag');
					node = nodeConstructors.tag(params);
				}
				return node;
			}
		};

		tree.forEach(params => {
			if (nodeConstructors[params.type]) {
				const node = nodeConstructors[params.type](params);
				root.appendChild(node);
			} else {
				throw new Error('Wrong node type:' + params.type);
			}

		});
	}
}

customElements.define('x-rp', RP);

export default RP;