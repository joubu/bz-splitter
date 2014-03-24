function add_accordion_to_filepaths( filepathlist_node ) {
  $( filepathlist_node ).accordion({
    collapsible: true,
    clearStyle: true,
    autoHeight: true,
    heightStyle: 'content',
    active: false,
    icons: { "header": "ui-icon-plus", "activeHeader": "ui-icon-minus" },
    header: "h3",
  });
}

$(document).ready(function(){
  $(function() {
    add_accordion_to_filepaths( $("#filepath-list") );
  });
});

