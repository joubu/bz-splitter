function build_buglist_node_for_filepath(bugs, filepath) {
    var bug_list = $('<div class="bug-list"></div>');
    $(bugs).each(function(){
      var new_bug_node = $('<div class="patch" data-bug_id=' + this['bug_id'] + ' data-filepath=' + filepath + ' ></div>');
      var title = $('<h4>Bug ' + this['bug_id'] + ':' + this['bug_title'] + ' ['+ this['bug_status'] + ']</h4>');
      $(title).appendTo(new_bug_node);
      $('<div></div>').appendTo(new_bug_node);
      $(new_bug_node).appendTo(bug_list);

      $('<span class="infos"><span class="num_lines_added"><span class="ui-icon ui-icon-circle-plus"></span>'+this['num_lines_added']+'</span><span class="num_lines_deleted"><span class="ui-icon ui-icon-circle-minus"></span>'+this['num_lines_deleted'] + '</span>').appendTo(new_bug_node);
    });
    return bug_list;
}

function build_buglist_node_for_author(bugs, author_name) {
    var bug_list = $('<div class="bug-list"></div>');
    $(bugs).each(function(){
      var new_bug_node = $('<div class="patch" data-bug_id=' + this['bug_id'] + ' data-author_name="' + author_name + '" ></div>');
      var title = $('<h4>Bug ' + this['bug_id'] + ':' + this['bug_title'] + ' ['+ this['bug_status'] + ']</h4>');
      $(title).appendTo(new_bug_node);
      $('<div></div>').appendTo(new_bug_node);

      $('<span class="infos"><span class="num_lines_added"><span class="ui-icon ui-icon-circle-plus"></span>'+this['num_lines_added']+'</span><span class="num_lines_deleted"><span class="ui-icon ui-icon-circle-minus"></span>'+this['num_lines_deleted'] + '</span>').appendTo(new_bug_node);
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
        var author_name = parent_node.data('author_name');
        if ( filepath ) {
          var url = '/patches/bug/'+bug_id+'/file/?filepath=' + filepath;
          $.getJSON( url, {format: 'json' }).done(function(data){
            var html = build_patchlist_node( data.patches );
            ui.newPanel.html( html );
          });
        } else {
          var url = '/patches/bug/'+bug_id+'/author/' + author_name;
          $.getJSON( url, {format: 'json' }).done(function(data){
            var html = build_patchlist_node( data.patches );
            ui.newPanel.html( html );
          });
        }
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

function add_accordion_to_authors( authorlist_node ) {
  $( authorlist_node ).accordion({
    collapsible: true,
    clearStyle: true,
    autoHeight: true,
    heightStyle: 'content',
    active: false,
    icons: { "header": "ui-icon-plus", "activeHeader": "ui-icon-minus" },
    header: "h3",
    beforeActivate: function(event, ui) {
      if ( ui.newPanel.html() == '' ) {
        var author_name = ui.newPanel.parent().data('author_name');
        var url = '/bugs/authors/' + author_name;
        $.getJSON( url, {format: 'json' }).done(function(data){
          var new_buglist_node = build_buglist_node_for_author( data.bugs, author_name );
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
function reorder_authors_by_add(){
    function sortNumChanges(a,b){
        return $(a).data("add") >$(b).data("add") ? -1 : 1;
    };
    $('#author-list > div.author').sort(sortNumChanges).appendTo('#author-list');
}
function reorder_authors_by_del(){
    function sortNumChanges(a,b){
        return $(a).data("del") >$(b).data("del") ? -1 : 1;
    };
    $('#author-list > div.author').sort(sortNumChanges).appendTo('#author-list');
}
function reorder_authors_by_alpha(){
    function sortNumChanges(a,b){
        return $(a).data("author_name") >$(b).data("author_name") ? 1 : -1;
    };
    $('#author-list > div.author').sort(sortNumChanges).appendTo('#author-list');
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
  $(".author-sort-by > .sort-by-add").click(function(){
    reorder_authors_by_add();
  });
  $(".author-sort-by > .sort-by-del").click(function(){
    reorder_authors_by_del();
  });
  $(".author-sort-by > .sort-by-alpha").click(function(){
    reorder_authors_by_alpha();
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
  $("#author-filter").on('keyup', function(){
    var pattern = $(this).val();
    delay(function(){
      var author_nodes = $("#author-list div.author");
      $(author_nodes).hide();
      $(author_nodes).filter(function( index ) {
        if ( $(this).attr('data-author_name').match(".*"+pattern+".*") ) {
          return 1
        }
        return 0
      }).show();
    }, 1000);
  });

  $(function() {
    add_accordion_to_filepaths( $("#filepath-list") );
  });
  $(function() {
    add_accordion_to_authors( $("#author-list") );
  });
});

