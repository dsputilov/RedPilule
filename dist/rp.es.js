import ObjectLive from 'object-live';

const inum = (() => {
	let uid = 0;
	return () => {
		uid++;
		return uid;
	};
})();

const splitSafe = function (str, splitter) {
	if (!splitter) {
		return [str];
	}
	//TODO: fix. Due to the fact that the script is loaded as a string and evals, slashes break
	let nodes = str.matchAll(new RegExp('(.*?[^\\\\])(?:\\' + splitter + '|$)', 'g'));
	let res = [];
	for (const match of nodes) {
		res.push(match[1]);
	}
	return res;
};

const isHash = function (value) {
	return value instanceof Object && value.constructor === Object && '' + value !== '[object Arguments]';
};

/**
 * @description Returns the value in the object found at the specified path
 * @param obj				{Object}
 * @param path				{String}
 * @param cfg				{Object=}
 * @param cfg.separator		{String=}	The separator is on the way. If the property is not specified but a dot is used
 * @returns {undefined|{hasOwnProperty}|*}
 */
const getPropertyByPath = function (obj, path, cfg) {
	if (path === '') {
		return obj;
	} else if (typeof path === 'string') {
		let pathSteps, pathStep, i, l;
		let separator = (cfg && cfg.separator) ? cfg.separator : '.';
		pathSteps = path.split(separator);
		for (i = 0, l = pathSteps.length; pathStep = pathSteps[i], i < l && pathStep && obj; i++) {
			if (obj.hasOwnProperty && obj.hasOwnProperty(pathStep)) {
				obj = obj[pathStep];
			} else {
				break;
			}
		}
		return i < l ? undefined : obj;
	} else {
		throw new Error('getPropertyByPath argument should be string');
	}
};


/**
 * @description set property by path in object
 * @param obj					{Object}
 * @param path					{String}
 * @param value					{Object}
 * @param options				{Object=}
 * @param options.separator		{String=}	The separator is on the way. If the property is not specified but a dot is used
 * @param options.isProperty	{Boolean=}
 * @param options.force			{Boolean=}	[default:true]	If the property already exists, then the new value will overwrite the existing one.
 * 											If you want the new value to be ignored, set this flag to false
 * @returns {*}
 */
const setPropertyByPath = function (obj, path, value, options) {
	//console.log('[setPropertyByPath]:', path, value, options);
	let originValue = value;
	let nodes;
	if (!options) {
		options = {};
	}

	if (path && typeof path === 'number') {				//isNumber
		path += '';										//fast fix for indexes in arrays //OPTIMIZE
	}
	if (path && typeof path === 'string') {
		//console.log('init obj: ', data.obj);
		if (options.isProperty) {
			nodes = [path];
		} else {
			let separator = options.separator || '.';
			nodes = splitSafe(path, separator);
		}
	} else if (Array.isArray(path)) {
		nodes = path;
	}
	if (nodes) {
		//console.log('[setPropertyByPath] obj:', obj, 'nodes:', nodes);
		let propertyName;
		let tmpValue = {};
		let tmpRef = tmpValue;
		let lastPropertyName = nodes.pop();

		nodes.forEach(function (nodeName) {
			if (!Object.prototype.hasOwnProperty.call(obj, nodeName)) {
				//console.log('+create node:', nodeName);
				if (!propertyName) {
					propertyName = nodeName;
				} else {
					tmpRef[nodeName] = {};
					tmpRef = tmpRef[nodeName];
				}
			} else {
				if (!isHash(obj[nodeName]) && !Array.isArray(obj[nodeName])) {
					//console.log('+convert node to hash:', obj, nodeName, 'isHash:', Object.isHash(obj[nodeName]), 'isArr:', Array.isArray(obj[nodeName]));
					obj[nodeName] = {};
				}
				obj = obj[nodeName];
			}
		});

		if (!propertyName) {
			propertyName = lastPropertyName;
			tmpValue = value;
		} else {
			tmpRef[lastPropertyName] = value;
		}

		if (options.force === false && obj.hasOwnProperty(propertyName)) {		//If the property already exists and cannot be overwritten
			return obj[propertyName];
		}

		value = tmpValue;
		obj[propertyName] = value;

	} else {
		throw new Error('Path should be string: ' + path + '[' + Number.is(path) + ']');
	}
	return originValue;
};

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

		this.#treeRender(this, tree.vDom.tree);

		Object.entries(this.#modelChangeHandlers).forEach(([path, handlers]) => {
			//console.warn('subscribe:', path);
			let renderPath = (cfg) => {
				//console.log();
				//console.log('model change:', path);
				handlers.forEach(handler => handler(cfg));
			};
			this.model.eventAdd("change", path, renderPath);

			if (path.indexOf('.') !== -1) {	//Если в пути есть точка, то может родитель измениться. Подписываемся на изменение родителя
				let rootPath = path.split('.')[0];		//TODO: нужно рекурсивно всех перебирать
				this.model.eventAdd("change", rootPath, renderPath);
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
							};
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
							};
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
						if (attrCfg.type === 'string') ; else if (attrCfg.type === 'json') {
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
};

customElements.define('x-rp', RP);

export { RP as default };
