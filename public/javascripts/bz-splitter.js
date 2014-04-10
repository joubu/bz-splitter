function build_buglist_node(params) {
    var bugs = params.bugs;
    var datatype = params.datatype;
    var data;
    if ( datatype == 'filepath' ) {
        data = params.filepath;
    } else if ( datatype == 'author_name' ) {
        data = params.author_name;
    } else if ( datatype == 'pattern' ) {
        data = params.pattern;
    }

    var bug_list = $('<div class="bug-list"></div>');
    $(bugs).each(function(){
      var new_bug_node = $('<div class="bug" data-bug_id="' + this['bug_id'] + '" data-'+datatype+'="' + data + '" data-add="'+this['num_lines_added']+'" data-del="'+this['num_lines_deleted']+'" ></div>');
      var title = $('<h4>Bug ' + this['bug_id'] + ':' + this['bug_title'] + ' ['+ this['bug_status'] + ']</h4>');
      $(title).appendTo(new_bug_node);
      $('<div>Loading...</div>').appendTo(new_bug_node);
      $(new_bug_node).appendTo(bug_list);

      $('<span class="infos"><span class="num_lines_added" title="This patch adds '+this['num_lines_added']+' lines"><span class="ui-icon ui-icon-circle-plus"></span>'+this['num_lines_added']+'</span><span class="num_lines_deleted" title="This patch removes '+this['num_lines_deleted']+' lines"><span class="ui-icon ui-icon-circle-minus"></span>'+this['num_lines_deleted'] + '</span>').appendTo(new_bug_node);
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
      if ( display == 'patterns' ) {
        var pattern_node = $('<h4 class="pattern">'+this['pattern']+'</h4>');
        $(new_patch_node).append(pattern_node);
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
          var author_name = parent_node.data('author_name');
          var pattern = parent_node.data('pattern');
          if ( filepath ) {
            var url = '/patches/bug/'+bug_id+'/file/?filepath=' + filepath;
            var display = 'authors';
            $.getJSON( url, {format: 'json' }).done(function(data){
              var html = build_patchlist_node( data.patches, data.base_url, display );
              $(html).find(".patch pre code").each(function(i, e) {hljs.highlightBlock(e)});
              ui.newPanel.html( html );
            });
          } else if ( author_name ) {
            var url = '/patches/bug/'+bug_id+'/author/' + author_name;
            var display = 'filepaths';
            $.getJSON( url, {format: 'json' }).done(function(data){
              var html = build_patchlist_node( data.patches, data.base_url, display );
              $(html).find(".patch pre code").each(function(i, e) {hljs.highlightBlock(e)});
              ui.newPanel.html( html );
            });
          } else {
            var url = '/patches/bug/'+bug_id+'/pattern/' + pattern;
            var display = 'patterns';
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

function build_tools_for_bugs( buglist_node ) {
  var tools_node = $('<div class="tools" style="display:inline;"></div>');
  var sort_by_node = $('<span class="bug-sort-by">Sort by:</span>');
  var sort_by_alpha_node = $('<span class="sort-by sort-by-alpha" title="sort by alpha">Alpha</span>');
  $(sort_by_alpha_node).on('click', function(){
    reorder_nodes( $( buglist_node ), $("div.bug"), "bug_id", "desc" );
  });
  var sort_by_add_node = $('<span class="sort-by sort-by-add ui-icon ui-icon-circle-plus" title="sort by add"></span>');
  $(sort_by_add_node).on('click', function(){
    reorder_nodes( $( buglist_node ), $("div.bug"), "add", "asc" );
  });
  var sort_by_del_node = $('<span class="sort-by sort-by-del ui-icon ui-icon-circle-minus" title="sort by del"></span>');
  $(sort_by_del_node).on('click', function(){
    reorder_nodes( $( buglist_node ), $("div.bug"), "del", "asc" );
  });

  $(sort_by_node).append( sort_by_alpha_node );
  $(sort_by_node).append( sort_by_add_node );
  $(sort_by_node).append( sort_by_del_node );
  $(tools_node).append( sort_by_node );
  return tools_node;
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
            var new_buglist_node = build_buglist_node( { bugs: data.bugs, datatype: 'filepath', filepath: filepath } );
            add_accordion_to_bugs( new_buglist_node );
            var new_tools_node = build_tools_for_bugs( new_buglist_node );
            ui.newPanel.html(new_tools_node);
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
            var new_buglist_node = build_buglist_node( { bugs: data.bugs, datatype: 'author_name', author_name: author_name } );
            add_accordion_to_bugs( new_buglist_node );
            var new_tools_node = build_tools_for_bugs( new_buglist_node );
            ui.newPanel.html(new_tools_node);
            ui.newPanel.append(new_buglist_node);
          });
          ui.newPanel.data("loaded", 1);
        }
        jump_to_header( ui, authorlist_node );
      }
    }
  });
}

function reorder_nodes( parent_node, children_selector, sort_by_data, order_modifier ) {
    function sort_by(a, b) {
        if ( order_modifier == "desc" )
            return $(a).data(sort_by_data) > $(b).data(sort_by_data) ? 1 : -1;
        return $(a).data(sort_by_data) > $(b).data(sort_by_data) ? -1 : 1;
    };
    $(parent_node).find(children_selector).sort(sort_by).appendTo(parent_node);
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
    reorder_nodes( $("#filepath-list"), 'div.filepath', 'add', 'asc' );
  });
  $(".filepath-sort-by > .sort-by-del").click(function(){
    reorder_nodes( $("#filepath-list"), 'div.filepath', 'del', 'asc' );
  });
  $(".filepath-sort-by > .sort-by-alpha").click(function(){
    reorder_nodes( $("#filepath-list"), 'div.filepath', 'filepath', 'desc' );
  });
  $(".author-sort-by > .sort-by-add").click(function(){
    reorder_nodes( $("#author-list"), 'div.author', 'add', 'asc' );
  });
  $(".author-sort-by > .sort-by-del").click(function(){
    reorder_nodes( $("#author-list"), 'div.author', 'del', 'asc' );
  });
  $(".author-sort-by > .sort-by-alpha").click(function(){
    reorder_nodes( $("#author-list"), 'div.author', 'author_name', 'desc' );
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

  $("#pattern-filter").on('change', function(){
    var pattern = $(this).val();
    if ( pattern.length == 0 ) { return false; }
    if ( pattern.length < 5 ) {
        alert ("The pattern should contain at least 5 characters")
        return false;
    }
    delay(function(){
      var url = '/bugs/patterns/' + pattern;
      $.getJSON( url, {format: 'json' }).done(function(data){
        var new_buglist_node = build_buglist_node( { bugs: data.bugs, datatype: 'pattern', pattern: data.pattern } );
        add_accordion_to_bugs( new_buglist_node );
        var new_tools_node = build_tools_for_bugs( new_buglist_node );
        $("#bug-list").html(new_tools_node);
        $("#bug-list").append(new_buglist_node);
      });
    }, 1000);
  });

  $(function() {
    add_accordion_to_filepaths( $("#filepath-list") );
  });
  $(function() {
    add_accordion_to_authors( $("#author-list") );
  });
});

