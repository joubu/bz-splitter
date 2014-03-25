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

$(document).ready(function(){
  $(function() {
    add_accordion_to_filepaths( $("#filepath-list") );
  });
});

