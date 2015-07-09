/**
 * @component
 * @description атрибут для сартировки колонок
 * @example
 <thead>
	 <tr columnSorter="{{M.ctrl.filter}}">
		 <th columnName="date">Дата</th>
		 <th columnName="amount">Сумма</th>
		 <th columnName="wmr">Счет WMR</th>
		 <th>Статус</th> если не указано - то колонка не сортируемая
	 </tr>
 </thead>
  */

$.Controller.register("ui::columnSorter", {
	start: function(self, node, cfg, parent) {
		cfg.attrs.setDefault({
			columnsorter:		{}
		});
		cfg.attrs.columnsorter.bridge({destObject: node, destPath: 'columnsorter'});
		var selectedColumn = '';
		node.view[0].childNodes.forEach(function(itemTh){
			if(!itemTh.getAttribute) return;
			var columnname = itemTh.getAttribute('columnname');
			if (columnname){
				itemTh.classList.add('cp');
				var arrow = document.createElement('i');
				arrow.classList.add('ico', 'pos_a', 'r3', 'b4');
				itemTh.appendChild(arrow);
				itemTh.columnname = columnname;
				if(columnname == node.model.columnsorter.sortBy && node.model.columnsorter.order){
					arrow.classList.add('sort_' + node.model.columnsorter.order);
					selectedColumn = arrow;
				}
				itemTh.addEventListener("click", function(){
					if (node.model.columnsorter.sortBy == itemTh.columnname) {
						node.model.columnsorter.order = node.model.columnsorter.order == 'desc' ? 'asc' : 'desc';
					}
					selectedColumn.classList.remove('sort_asc', 'sort_desc');
					arrow.classList.add('sort_' + node.model.columnsorter.order);
					selectedColumn = arrow;
					node.model.columnsorter.sortBy = itemTh.columnname;
				});
			}
		});
	}
});