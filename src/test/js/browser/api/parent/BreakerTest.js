test(
  'parent :: Breaker',

  [
    'ephox.boss.api.DomUniverse',
    'ephox.compass.Arr',
    'ephox.peanut.Fun',
    'ephox.perhaps.Option',
    'ephox.robin.api.dom.DomParent',
    'ephox.sugar.api.Compare',
    'ephox.sugar.api.Element',
    'ephox.sugar.api.Hierarchy',
    'ephox.sugar.api.Html',
    'ephox.sugar.api.SelectorFind'
  ],

  function (DomUniverse, Arr, Fun, Option, DomParent, Compare, Element, Hierarchy, Html, SelectorFind) {

    var check = function (expected, p, c) {
      var container = Element.fromTag('div');
      container.dom().innerHTML =
        '<ol class="one-nine" style="list-style-type: decimal;">' +
          '<li class="one">One</li>' +
          '<li class="two">Two</li>' +
          '<ol class="three-five" style="list-style-type: lower-alpha;">' +
            '<li class="three">three</li>' +
            '<li class="four">four</li>' +
            '<li class="five">five</li>' +
          '</ol>' +
          '<li class="six">six</li>' +
          '<ol class="seven-nine" style="list-style-type: lower-alpha;">' +
            '<ol class="seven-eight" style="list-style-type: lower-roman;">' +
              '<li class="seven">seven</li>' +
              '<li class="eight">eight</li>' +
            '</ol>' +
            '<li class="nine">nine</li>' +
          '</ol>' +
        '</ol>';

      var parent = SelectorFind.descendant(container, '.' + p).getOrDie();
      var child = SelectorFind.descendant(container, '.' + c).getOrDie();
      DomParent.breakToRight(parent, child);
      assert.eq(expected, Html.get(container));
    };

    check('<ol class="one-nine" style="list-style-type: decimal;">' +
          '<li class="one">One</li>' +
          '<li class="two">Two</li>' +
          '<ol class="three-five" style="list-style-type: lower-alpha;">' +
            '<li class="three">three</li>' +
            '<li class="four">four</li>' +
            '<li class="five">five</li>' +
          '</ol>' +
          '<ol class="three-five" style="list-style-type: lower-alpha;">' +
          '</ol>' +
          '<li class="six">six</li>' +
          '<ol class="seven-nine" style="list-style-type: lower-alpha;">' +
            '<ol class="seven-eight" style="list-style-type: lower-roman;">' +
              '<li class="seven">seven</li>' +
              '<li class="eight">eight</li>' +
            '</ol>' +
            '<li class="nine">nine</li>' +
          '</ol>' +
        '</ol>', 'three-five', 'five', DomParent.breakToRight);

    check(
        '<ol class="one-nine" style="list-style-type: decimal;">' +
          '<li class="one">One</li>' +
          '<li class="two">Two</li>' +
          '<ol class="three-five" style="list-style-type: lower-alpha;">' +
            '<li class="three">three</li>' +
            '<li class="four">four</li>' +
            '<li class="five">five</li>' +
          '</ol>' +
          '<li class="six">six</li>' +
        '</ol>' +
        '<ol class="one-nine" style="list-style-type: decimal;">' +
          '<ol class="seven-nine" style="list-style-type: lower-alpha;">' +
            '<ol class="seven-eight" style="list-style-type: lower-roman;">' +
              '<li class="seven">seven</li>' +
              '<li class="eight">eight</li>' +
            '</ol>' +
            '<li class="nine">nine</li>' +
          '</ol>' +
        '</ol>', 'one-nine', 'six', DomParent.breakToRight);


    var checkPath = function (expected, input, p, c) {
      console.log('TEST');
      var container = Element.fromTag('div');
      container.dom().innerHTML = input;

      var parent = Hierarchy.follow(container, p).getOrDie();
      var child = Hierarchy.follow(container, c).getOrDie();
      var isTop = Fun.curry(Compare.eq, parent);
      DomParent.breakPath(child, isTop, DomParent.breakToLeft);
      assert.eq(expected, Html.get(container));
    };

    checkPath(
      '<div>' +
        '<font>' +
          '<span>Cat</span>' +
          '<span>Dog</span>' +
        '</font>' +
        '<font>' +
          '<span></span>' +
        '</font>' +
      '</div>',

      '<div>' +
        '<font>' +
          '<span>Cat</span>' +
          '<span>Dog</span>' +
        '</font>' +
      '</div>',
      [ 0, 0 ], [ 0, 0, 1, 0 ]);

    checkPath(
      '<div>' +
        '<font>' +
          '<span>Cat</span>' +
          '<span>' +
            'Hello' +
            '<br>' + // --- SPLIT to <font>
          '</span>' +
        '</font>' +
        '<font>' +
          '<span>' +
            'World' +
          '</span>' +
          '<span>Dog</span>' +
        '</font>' +
      '</div>',

      '<div>' +
        '<font>' +
          '<span>Cat</span>' +
          '<span>' +
            'Hello' +
            '<br>' +
            'World' +
          '</span>' +
          '<span>Dog</span>' +
        '</font>' +
      '</div>',
      [ 0, 0 ], [ 0, 0, 1, 1 ]);

    checkPath(
      '<div>' +
        '<font>' +
          '<span>Cat</span>' +
          '<span>' +
            'Hello' +
            '<br>' + 
            'World' + // --- SPLIT to <font>
          '</span>' +
        '</font>' +
        '<font>' +
          '<span></span>' +
          '<span>Dog</span>' +
        '</font>' +
      '</div>',

      '<div>' +
        '<font>' +
          '<span>Cat</span>' +
          '<span>' +
            'Hello' +
            '<br>' +
            'World' +
          '</span>' +
          '<span>Dog</span>' +
        '</font>' +
      '</div>',
      [ 0, 0 ], [ 0, 0, 1, 2 ]);

    checkPath(
      '<div>' +
        '<font>' +
          '<span>Cat</span>' +
          '<span>' +
            'Hello' + // --- SPLIT to <font>            
          '</span>' +
        '</font>' +
        '<font>' +
          '<span>' +
            '<br>' + 
            'World' +
          '</span>' +
          '<span>Dog</span>' +
        '</font>' +
      '</div>',

      '<div>' +
        '<font>' +
          '<span>Cat</span>' +
          '<span>' +
            'Hello' +
            '<br>' +
            'World' +
          '</span>' +
          '<span>Dog</span>' +
        '</font>' +
      '</div>',
      [ 0, 0 ], [ 0, 0, 1, 0 ]);
  }
);
