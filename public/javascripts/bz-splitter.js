function build_buglist_node_for_filepath(bugs, filepath) {
    var bug_list = $('<div class="bug-list"></div>');
    $(bugs).each(function(){
      var new_bug_node = $('<div class="bug" data-bug_id=' + this['bug_id'] + ' data-filepath=' + filepath + ' data-add="'+this['num_lines_added']+'" data-del="'+this['num_lines_deleted']+'" ></div>');
      var title = $('<h4>Bug ' + this['bug_id'] + ':' + this['bug_title'] + ' ['+ this['bug_status'] + ']</h4>');
      $(title).appendTo(new_bug_node);
      $('<div>Loading...</div>').appendTo(new_bug_node);
      $(new_bug_node).appendTo(bug_list);

      $('<span class="infos"><span class="num_lines_added" title="This patch adds '+this['num_lines_added']+' lines in '+filepath+'"><span class="ui-icon ui-icon-circle-plus"></span>'+this['num_lines_added']+'</span><span class="num_lines_deleted" title="This patch removes '+this['num_lines_deleted']+' lines in '+filepath+'"><span class="ui-icon ui-icon-circle-minus"></span>'+this['num_lines_deleted'] + '</span>').appendTo(new_bug_node);
    });
    return bug_list;
}

function build_buglist_node_for_author(bugs, author_name) {
    var bug_list = $('<div class="bug-list"></div>');
    $(bugs).each(function(){
      var new_bug_node = $('<div class="bug" data-bug_id=' + this['bug_id'] + ' data-author_name="' + author_name + '" data-add="'+this['num_lines_added']+'" data-del="'+this['num_lines_deleted']+'"></div>');
      var title = $('<h4>Bug ' + this['bug_id'] + ':' + this['bug_title'] + ' ['+ this['bug_status'] + ']</h4>');
      $(title).appendTo(new_bug_node);
      $('<div>Loading...</div>').appendTo(new_bug_node);

      $('<span class="infos"><span class="num_lines_added" title="This patch adds '+this['num_lines_added']+' lines"><span class="ui-icon ui-icon-circle-plus"></span>'+this['num_lines_added']+'</span><span class="num_lines_deleted" title="This patch removes '+this['num_lines_deleted']+' lines"><span class="ui-icon ui-icon-circle-minus"></span>'+this['num_lines_deleted'] + '</span>').appendTo(new_bug_node);
      $(new_bug_node).appendTo(bug_list);
    });
    return bug_list;
}

function build_patchlist_node(patches, base_url, display) {
    var patch_list = $('<div class="patch-list"></div>');
    $(patches).each(function(){
      var new_patch_node = $('<div class="patch"></div>');
      var title_node = $('<h3>'+this['attachment_description']+'<a href="'+base_url+'attachment.cgi?id='+this['attachment_id']+'" alt="Go to the attachment" title="Go to the attachment"><span class="ui-icon ui-icon-extlink"></span></a></h3>');
      $(new_patch_node).append(title_node);
      if ( display == 'authors' ) {
        var author_node = $('<h4 class="author">'+this['author_name']+'</h4>');
        $(new_patch_node).append(author_node);
      }
      if ( display == 'filepaths' ) {
        var filepath_node = $('<h4 class="filepaths">'+this['filepath']+'</h4>');
        $(new_patch_node).append(filepath_node);
      }
      var diff_node = $('<pre><code>'+this['diff']+'</code></pre></div>');
      $(new_patch_node).append(diff_node);
      $(patch_list).append(new_patch_node);
    });
    return patch_list;
}

function jump_to_header( ui, accordion ) {
  if ( ui.newHeader.length > 0 ) {
    var scrollTop = $(accordion).scrollTop();
    var top = $(ui.newHeader).offset().top;
    $("html,body").animate({ scrollTop: scrollTop + top }, 200);
  }
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
    activate: function(event, ui) {
      if ( ui.newPanel.length > 0 ) {
        if ( !ui.newPanel.data("loaded") ) {
          var parent_node = ui.newPanel.parent();
          var bug_id = parent_node.data('bug_id');
          var filepath = parent_node.data('filepath');
          if ( filepath ) {
            var url = '/patches/bug/'+bug_id+'/file/?filepath=' + filepath;
            var display = 'authors';
            $.getJSON( url, {format: 'json' }).done(function(data){
              var html = build_patchlist_node( data.patches, data.base_url, display );
              $(html).find(".patch pre code").each(function(i, e) {hljs.highlightBlock(e)});
              ui.newPanel.html( html );
            });
          } else {
            var author_name = parent_node.data('author_name');
            var url = '/patches/bug/'+bug_id+'/author/' + author_name;
            var display = 'filepaths';
            $.getJSON( url, {format: 'json' }).done(function(data){
              var html = build_patchlist_node( data.patches, data.base_url, display );
              $(html).find(".patch pre code").each(function(i, e) {hljs.highlightBlock(e)});
              ui.newPanel.html( html );
            });
          }
          ui.newPanel.data("loaded", 1);
        }
        jump_to_header( ui, buglist_node);
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
    activate: function(event, ui) {
      if ( ui.newPanel.length > 0 ) {
        if ( !ui.newPanel.data("loaded") ) {
          var filepath = ui.newPanel.parent().data('filepath');
          var url = '/bugs/file/?filepath=' + filepath;
          $.getJSON( url, {format: 'json' }).done(function(data){
            var new_buglist_node = build_buglist_node_for_filepath( data.bugs, filepath );
            add_accordion_to_bugs( new_buglist_node );
            var tools_node = $('<div class="tools" style="display:inline;"></div>');
            $(tools_node).append( $('<span class="bug-sort-by">Sort by:</span>') );
            var sort_by_add_node = $('<span class="sort-by sort-by-add ui-icon ui-icon-circle-plus" title="sort by add"></span>');
            $(sort_by_add_node).on('click', function(){
                reorder_bugs_by_add(this);
            });
            var sort_by_del_node = $('<span class="sort-by sort-by-del ui-icon ui-icon-circle-minus" title="sort by del"></span>');
            $(sort_by_del_node).on('click', function(){
                reorder_bugs_by_del(this);
            });
            var sort_by_alpha_node = $('<span class="sort-by sort-by-alpha" title="sort by alpha">Alpha</span>');
            $(sort_by_alpha_node).on('click', function(){
                reorder_bugs_by_alpha(this);
            });
            $(tools_node).append( sort_by_add_node );
            $(tools_node).append( sort_by_del_node );
            $(tools_node).append( sort_by_alpha_node );
            ui.newPanel.html( tools_node );
            ui.newPanel.append(new_buglist_node);
          });
          ui.newPanel.data("loaded", 1);
        }
        jump_to_header( ui, filepathlist_node);
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
    activate: function(event, ui) {
      if ( ui.newPanel.length > 0 ) {
        if ( !ui.newPanel.data("loaded") ) {
          var author_name = ui.newPanel.parent().data('author_name');
          var url = '/bugs/authors/' + author_name;
          $.getJSON( url, {format: 'json' }).done(function(data){
            var new_buglist_node = build_buglist_node_for_author( data.bugs, author_name );
            ui.newPanel.html( new_buglist_node );
            add_accordion_to_bugs( new_buglist_node );
          });
          ui.newPanel.data("loaded", 1);
        }
        jump_to_header( ui, authorlist_node );
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
function reorder_bugs_by_add(list_node){
    function sortNumChanges(a,b){
        return $(a).data("add") >$(b).data("add") ? -1 : 1;
    };
    $(list_node).parent().parent().find('div.bug').sort(sortNumChanges).appendTo($(list_node).parent().parent());
}
function reorder_bugs_by_del(list_node){
    function sortNumChanges(a,b){
        return $(a).data("del") >$(b).data("del") ? -1 : 1;
    };
    $(list_node).parent().parent().find('div.bug').sort(sortNumChanges).appendTo($(list_node).parent().parent());
}
function reorder_bugs_by_alpha(list_node){
    function sortNumChanges(a,b){
        return $(a).html() >$(b).html() ? 1 : -1;
    };
    $(list_node).parent().parent().find('div.bug').sort(sortNumChanges).appendTo($(list_node).parent().parent());
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
  $(".bug-sort-by > .sort-by-add").click(function(){
      console.log("add");
    var list_node = $(this).parent().parent().parent().find("div.bug-list");
    console.log(list_node);
    reorder_bugs_by_add(list_node);
  });
  $(".bug-sort-by > .sort-by-del").click(function(){
    reorder_bugs_by_del(this);
  });
  $(".bug-sort-by > .sort-by-alpha").click(function(){
    reorder_bugs_by_alpha(this);
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

