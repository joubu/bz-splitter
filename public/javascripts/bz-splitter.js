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

function build_patchlist_node(patches, filepath) {
    var patch_list = $('<div class="patch-list"></div>');
    $(patches).each(function(){
      // TODO Add link to attachment
      var new_patch_node = $('<div class="patch"><h3>'+this['attachment_description']+'</h3><pre><code>'+this['diff']+'</code></pre></div>');
      $(new_patch_node).appendTo(patch_list);
    });
    return patch_list;
}

function add_accordion_to_bugs ( buglist_node ) {
  $( buglist_node ).accordion({
    collapsible: true,
    clearStyle: true,
    autoHeight: true,
    heightStyle: 'content',
    active: false,
    icons: { "header": "ui-icon-circle-triangle-e", "activeHeader": "ui-icon-circle-triangle-s" },
    header: "h4",
    beforeActivate: function(event, ui) {
      if ( ui.newPanel.html() == '' ) {
        var parent_node = ui.newPanel.parent();
        var bug_id = parent_node.data('bug_id');
        var filepath = parent_node.data('filepath');
        var url = '/patches/bug/'+bug_id+'/file/?filepath=' + filepath;
        $.getJSON( url, {format: 'json' }).done(function(data){
          var html = build_patchlist_node( data.patches );
          ui.newPanel.html( html );
        });
      }
    },
    activate: function(event, ui) {
      if (ui.newPanel.html() != '' ) {
        $(ui.newPanel).find(".patch pre code").each(function(i, e) {hljs.highlightBlock(e)});
      }
    }
  });
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

/* FIXME Refactor these ugly functions */
function reorder_filepaths_by_add(){
    function sortNumChanges(a,b){
        return $(a).data("add") >$(b).data("add") ? -1 : 1;
    };
    $('#filepath-list > div.filepath').sort(sortNumChanges).appendTo('#filepath-list');
}
function reorder_filepaths_by_del(){
    function sortNumChanges(a,b){
        return $(a).data("del") >$(b).data("del") ? -1 : 1;
    };
    $('#filepath-list > div.filepath').sort(sortNumChanges).appendTo('#filepath-list');
}
function reorder_filepaths_by_alpha(){
    function sortNumChanges(a,b){
        return $(a).data("filepath") >$(b).data("filepath") ? 1 : -1;
    };
    $('#filepath-list > div.filepath').sort(sortNumChanges).appendTo('#filepath-list');
}

var delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

$(document).ready(function(){
  $(".filepath-sort-by > .sort-by-add").click(function(){
    reorder_filepaths_by_add();
  });
  $(".filepath-sort-by > .sort-by-del").click(function(){
    reorder_filepaths_by_del();
  });
  $(".filepath-sort-by > .sort-by-alpha").click(function(){
    reorder_filepaths_by_alpha();
  });

  $("#filepath-filter").on('keyup', function(){
    var pattern = $(this).val();
    delay(function(){
      var filepath_nodes = $("#filepath-list div.filepath");
      $(filepath_nodes).hide();
      $(filepath_nodes).filter(function( index ) {
        if ( $(this).attr('data-filepath').match(".*"+pattern+".*") ) {
          return 1
        }
        return 0
      }).show();
    }, 1000);
  });
  $(function() {
    add_accordion_to_filepaths( $("#filepath-list") );
  });
});

