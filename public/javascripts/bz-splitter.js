function add_accordion_to_bugs ( buglist_node ) {
  $( buglist_node ).accordion({
    collapsible: true,
    clearStyle: true,
    autoHeight: true,
    heightStyle: 'content',
    active: false,
    icons: { "header": "ui-icon-circle-triangle-e", "activeHeader": "ui-icon-circle-triangle-s" },
    header: "h4",
  });
}
function build_buglist_node_for_filepath(bugs, filepath) {
    var bug_list = $('<div class="bug-list"></div>');
    $(bugs).each(function(){
      var new_bug_node = $('<div class="patch" data-bug_id=' + this['bug_id'] + ' data-filepath=' + filepath + ' ></div>');
      var title = $('<h4>Bug ' + this['bug_id'] + ':' + this['bug_title'] + ' ['+ this['bug_status'] + ']</h4>');
      $(title).appendTo(new_bug_node);
      $('<div></div>').appendTo(new_bug_node);
      $(new_bug_node).appendTo(bug_list);
    });
    return bug_list;
}

function add_accordion_to_filepaths( filepathlist_node ) {
  $( filepathlist_node ).accordion({
    collapsible: true,
    clearStyle: true,
    autoHeight: true,
    heightStyle: 'content',
    active: false,
    icons: { "header": "ui-icon-plus", "activeHeader": "ui-icon-minus" },
    header: "h3",
    beforeActivate: function(event, ui) {
      if ( ui.newPanel.html() == '' ) {
        var filepath = ui.newPanel.parent().data('filepath');
        var url = '/bugs/file/?filepath=' + filepath;
        $.getJSON( url, {format: 'json' }).done(function(data){
          var new_buglist_node = build_buglist_node_for_filepath( data.bugs, filepath );
          ui.newPanel.html( new_buglist_node );
          add_accordion_to_bugs( new_buglist_node );
        });
      }
    }
  });
}

$(document).ready(function(){
  $(function() {
    add_accordion_to_filepaths( $("#filepath-list") );
  });
});

