function build_buglist_node(params) {
    var bugs = params.bugs;
    var datatype = params.datatype;
    var data = params.data;

    var bug_list = $('<div class="bug-list"></div>');
    if ( $(bugs).length > 0 ) {
      $(bugs).each(function(){
        var new_bug_node = $('<div class="bug" data-bug_id="' + this['bug_id'] + '" data-'+datatype+'="' + data + '" data-add="'+this['num_lines_added']+'" data-del="'+this['num_lines_deleted']+'" ></div>');
        var title = $('<h4>Bug ' + this['bug_id'] + ':' + this['bug_title'] + ' ['+ this['bug_status'] + ']</h4>');
        $(title).appendTo(new_bug_node);
        $('<div>Loading...</div>').appendTo(new_bug_node);
        $(new_bug_node).appendTo(bug_list);

        $('<span class="infos"><span class="num_lines_added" title="This patch adds '+this['num_lines_added']+' lines"><span class="ui-icon ui-icon-circle-plus"></span>'+this['num_lines_added']+'</span><span class="num_lines_deleted" title="This patch removes '+this['num_lines_deleted']+' lines"><span class="ui-icon ui-icon-circle-minus"></span>'+this['num_lines_deleted'] + '</span>').appendTo(new_bug_node);
      });
    }
    return bug_list;
}

function build_patchlist_node(params) {
    var patches = params.patches;
    var base_url = params.base_url;
    var titles = params.titles;
    var patch_list = $('<div class="patch-list"></div>');
    $(patches).each(function(){
      var patch = this;
      var new_patch_node = $('<div class="patch"></div>');
      var title_node;
      $.each(titles, function(tag, element_to_display){
          title_node = $('<'+tag+' class='+element_to_display+'></'+tag+'>');
          if ( element_to_display == 'attachment' ) {
            $(title_node).html(patch['attachment_description']+'<a href="'+base_url+'attachment.cgi?id='+patch['attachment_id']+'" alt="Go to the attachment" title="Go to the attachment"><span class="ui-icon ui-icon-extlink"></span></a>');
          } else if ( element_to_display == 'author' ) {
            $(title_node).html(patch['author_name']);
          } else if ( element_to_display == 'filepath' ) {
            $(title_node).html(patch['filepath']);
          }
          $(new_patch_node).append(title_node);
      });
      var diff_node = $('<pre><code>'+patch['diff']+'</code></pre>');
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
            $.getJSON( url, {format: 'json' }).done(function(data){
              var html = build_patchlist_node({ patches: data.patches, base_url: data.base_url, titles: {h3: 'attachment', h4: 'author'} });
              $(html).find(".patch pre code").each(function(i, e) {hljs.highlightBlock(e)});
              ui.newPanel.html( html );
            })
            .fail(function(){
                ui.newPanel.html( 'An error occurred , please try again later...' );
            });
          } else if ( author_name ) {
            var url = '/patches/bug/'+bug_id+'/author/' + author_name;
            $.getJSON( url, {format: 'json' }).done(function(data){
              var html = build_patchlist_node({ patches: data.patches, base_url: data.base_url, titles: {h3: 'attachment', h4: 'filepath'} });
              $(html).find(".patch pre code").each(function(i, e) {hljs.highlightBlock(e)});
              ui.newPanel.html( html );
            })
            .fail(function(){
                ui.newPanel.html( 'An error occurred , please try again later...' );
            });
          } else {
            var url = '/patches/bug/'+bug_id+'/pattern/' + pattern;
            $.getJSON( url, {format: 'json' }).done(function(data){
              var html = build_patchlist_node({ patches: data.patches, base_url: data.base_url, titles: {h3: 'attachment', h4: 'author'} });
              $(html).find(".patch pre code").each(function(i, e) {hljs.highlightBlock(e)});
              ui.newPanel.html( html );
            })
            .fail(function(){
                ui.newPanel.html( 'An error occurred , please try again later...' );
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

function add_datatable_to_list( list_node, datatype ) {
  if ( $(list_node).length <=0 ) {
    return false;
  }
  var table = $( list_node ).dataTable( {
    "aoColumnDefs": [
        { "bSortable": false, "aTargets": [ 0 ] }
    ],
    "aaSorting": [[1, 'asc']],
    "aLengthMenu": [[10, 20, 50, 100, -1], [10, 20, 50, 100, "All"]],
    "iDisplayLength": 20,
    "sPaginationType": "full_numbers",
    "bAutoWidth": false,
    "sDom": '<"top pager"lf>tr<"bottom pager"ip>',

    "aoColumns": [
      { "sWidth": "10%" },
      { "sWidth": "30%" },
      { "sWidth": "15%" },
      { "sWidth": "15%" },
      { "sWidth": "15%" },
      { "sWidth": "15%" }
    ],
  } );
  $(table.fnGetNodes() ).each( function () {
    $(this).click( function () {
      var tr = this;
      if ( table.fnIsOpen(tr) ) {
          $(this).find('td:first span').removeClass('ui-icon-minus');
          $(this).find('td:first span').addClass('ui-icon-plus');
          table.fnClose( tr );
      }
      else {
        $(this).find('td:first span').removeClass('ui-icon-plus');
        $(this).find('td:first span').addClass('ui-icon-minus');

        var td_class;
        if ( $(tr).hasClass('odd') ) {
            td_class = 'odd';
        } else {
            td_class = 'even';
        }
        var newRow = table.fnOpen( tr, "Loading...", td_class );

        var data = table.fnGetData( tr )[1];

        var status_string = '';
        $("input:checkbox[name='status']:checked").each(function(){
          status_string += '&status=' + $(this).val();
        });

        var url;
        if ( datatype == 'filepath' ) {
          url = '/bugs/file/?filepath=' + data + status_string;
        } else if ( datatype == 'author_name' ) {
          url = '/bugs/authors/' + data + '?' + status_string;
        }

        $.ajax( {
            dataType: 'json',
            type: "POST",
            url: url,
            success: function ( json_data ) {
              if ( json_data.bugs.length > 0 ) {
                new_buglist_node = build_buglist_node( { bugs: json_data.bugs, datatype: datatype, data: data } );
                add_accordion_to_bugs( new_buglist_node );
                var new_tools_node = build_tools_for_bugs( new_buglist_node );
                $('td', newRow).html( new_tools_node );
                $('td', newRow).append( new_buglist_node );
              } else {
                $('td', newRow).html( 'No match!' );
              }
            },
            error: function () {
                $('td', newRow).html( 'An error occurred , please try again later...' );
            }
        } );
      }
    } );
  } );
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
        var new_buglist_node = build_buglist_node( { bugs: data.bugs, datatype: 'pattern', data: data.pattern } );
        add_accordion_to_bugs( new_buglist_node );
        var new_tools_node = build_tools_for_bugs( new_buglist_node );
        $("#bug-list").html(new_tools_node);
        $("#bug-list").append(new_buglist_node);
      });
    }, 1000);
  });

  $(function() {
    add_datatable_to_list( $("#filepath-list"), 'filepath' );
  });
  $(function() {
    add_datatable_to_list( $("#author-list"), 'author_name' );
  });
});

