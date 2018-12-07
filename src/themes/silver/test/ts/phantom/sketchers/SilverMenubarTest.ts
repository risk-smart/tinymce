import {
  ApproxStructure,
  Assertions,
  FocusTools,
  GeneralSteps,
  Keyboard,
  Keys,
  Logger,
  Step,
  UiFinder,
  Waiter,
  Chain,
  Log,
  Mouse,
} from '@ephox/agar';
import { Behaviour, GuiFactory, Memento, Positioning } from '@ephox/alloy';
import { UnitTest } from '@ephox/bedrock';
import { Result, Fun, Arr, Strings } from '@ephox/katamari';
import { SelectorFind, Selectors } from '@ephox/sugar';

import * as Icons from '../../../../main/ts/ui/icons/Icons';
import SilverMenubar from '../../../../main/ts/ui/menus/menubar/SilverMenubar';
import { GuiSetup } from '../../module/AlloyTestUtils';
import I18n from 'tinymce/core/api/util/I18n';

// TODO: Expose properly through alloy.
UnitTest.asynctest('SilverMenubar Test', (success, failure) => {

  GuiSetup.setup(
    (store, doc, body) => {
      const memSink = Memento.record({
        dom: {
          tag: 'div',
          classes: [ 'test-sink' ]
        },
        behaviours: Behaviour.derive([
          Positioning.config({ })
        ])
      });

      const container = GuiFactory.build({
        dom: {
          tag: 'div',
          classes: [ 'silvermenubar-test-container' ]
        },
        components: [
          memSink.asSpec(),
          SilverMenubar.sketch({
            dom: {
              tag: 'div',
              classes: [ 'test-menubar' ]
            },
            onEscape: store.adder('Menubar.escape'),
            onSetup: store.adder('Menubar.setup'),
            providers: {
              icons: () => <Record<string, string>> {},
              menuItems: () => <Record<string, any>> {},
              translate: I18n.translate
            },
            getSink: () => {
              return memSink.getOpt(container).fold(
                () => Result.error('Could not find the sink for some reason'),
                Result.value
              );
            }
          })
        ]
      });

      return container;
    },
    (doc, body, gui, testContainer, store) => {
      const menubarEl = SelectorFind.descendant(testContainer.element(), '.test-menubar').getOrDie('Could not find menubar to test');

      const menubar = testContainer.getSystem().getByDom(menubarEl).getOrDie();

      const sAssertFocusOnToggleItem = (itemText: string) =>
        FocusTools.sTryOnSelector(
          'Focus should be on a toggle menu item containing: ' + itemText,
          doc,
          '.tox-selected-menu [role=menuitemcheckbox]:contains("' + itemText + '")'
        );

      const sAssertActiveToggleItemHasOneCheckmark = (itemText: string) =>
        Chain.asStep(testContainer.element(), [
          UiFinder.cFindIn('.tox-selected-menu [role=menuitemcheckbox]:contains("' + itemText + '")'),
          Chain.op((menu) => {
            const checkMarks = Selectors.all('.tox-collection__item-icon');
            Assertions.assertEq('only one check mark is displayed for active toggled menu items', 1, checkMarks.length);
          })
        ]);

      const sAssertFocusOnItem = (itemText: string) =>
        FocusTools.sTryOnSelector(
          'Focus should be on item containing: ' + itemText,
          doc,
          '.tox-selected-menu [role=menuitem]:contains("' + itemText + '")'
        );

      const sAssertFocusOnMenuButton = (buttonText: string) =>
        FocusTools.sTryOnSelector(
          'Focus should be on menubar button containing: ' + buttonText,
          doc,
          '[role=menubar] button[role=menuitem]:contains("' + buttonText + '")'
        );

      const sWaitForMenuToAppear = () =>
        // Wait for menu to appear
        Waiter.sTryUntil(
          'Waiting for menu to be in DOM',
          UiFinder.sExists(testContainer.element(), '.tox-menu'),
          100,
          1000
        );

      const sWaitForMenuToDisappear = () =>
        Waiter.sTryUntil(
          'Waiting for menu to NO LONGER be in DOM',
          UiFinder.sNotExists(testContainer.element(), '.tox-menu'),
          100,
          1000
        );

      const sAssertMenuItemGroups = (label: string, groups: string[][]) => Logger.t(
        label,
        Chain.asStep(testContainer.element(), [
          UiFinder.cFindIn('.tox-selected-menu'),
          Assertions.cAssertStructure(
            'Checking contents of menu',
            ApproxStructure.build((s, str, arr) => {
              return s.element('div', {
                children: Arr.map(groups, (items) => {
                  return s.element('div', {
                    classes: [ arr.has('tox-collection__group') ],
                    children: Arr.map(items, (itemText) => {
                      // itemText can have a trailing >, which means it has a caret
                      const hasCaret = Strings.endsWith(itemText, '>');
                      return s.element('div', {
                        classes: [ arr.has('tox-collection__item') ],
                        children: [
                          s.element('span', { classes: [ arr.has('tox-collection__item-icon') ] }),
                          s.element('span', {
                            classes: [ arr.has('tox-collection__item-label') ],
                            html: str.is(hasCaret ? itemText.substring(0, itemText.length - 1) : itemText)
                          })
                        ].concat(hasCaret ? [
                          s.element('span', { classes: [ arr.has('tox-collection__item-caret') ] })
                        ] : [ ])
                      });
                    })
                  });
                })
              });
            })
          )
        ])
      );

      return [
        store.sAssertEq('setup should have been called', [ 'Menubar.setup' ]),
        store.sClear,
        Assertions.sAssertStructure(
          'Checking initial structure for menubar',
          ApproxStructure.build((s, str, arr) => {
            return s.element('div', {
              classes: [arr.has('test-menubar')],
              attrs: {
                role: str.is('menubar')
              },
              children: [ ]
            });
          }),
          menubar.element()
        ),

        Logger.t(
          'Setup some menubar groups',
          Step.sync(() => {
            SilverMenubar.setMenus(menubar, [
              {
                text: 'Changes',
                getItems: () => [
                  {
                    type: 'togglemenuitem',
                    text: 'Remember me',
                    onAction: store.adder('remember.me'),
                    onSetup: (api) => {
                      // Set twice to check for a bug where two checkmarks appear
                      api.setActive(true);
                      api.setActive(true);
                      return Fun.noop;
                    }
                  }
                ]
              },
              {
                text: 'Basic Menu Button',
                getItems: () => [
                  {
                    type: 'menuitem',
                    text: 'Item1',
                    icon: Icons.getDefault('drop'),
                    onAction: store.adder('menuitem-1-action')
                  },
                  {
                    type: 'separator'
                  },
                  {
                    type: 'menuitem',
                    icon: Icons.getDefault('drop'),
                    text: 'Item2',
                    onAction: () => {
                      store.adder('menuitem-2 action')();
                    }
                  },
                  {
                    type: 'nestedmenuitem',
                    icon: Icons.getDefault('drop'),
                    text: 'Nested menu',
                    getSubmenuItems: () => [
                      {
                        type: 'nestedmenuitem',
                        icon: Icons.getDefault('drop'),
                        text: 'Nested menu x 2',
                        getSubmenuItems: () => [
                          {
                            type: 'menuitem',
                            icon: Icons.getDefault('drop'),
                            text: 'Nested menu x 3',
                            onAction: () => { }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]);
          })
        ),

        Step.sync(() => {
          SilverMenubar.focus(menubar);
        }),

        sAssertFocusOnMenuButton('Changes'),
        Keyboard.sKeydown(doc, Keys.space(), { }),
        sWaitForMenuToAppear(),
        sAssertFocusOnToggleItem('Remember me'),
        sAssertActiveToggleItemHasOneCheckmark('Remember me'),
        Keyboard.sKeydown(doc, Keys.escape(), { }),
        sAssertFocusOnMenuButton('Changes'),
        sWaitForMenuToDisappear(),

        Keyboard.sKeydown(doc, Keys.right(), {}),
        sAssertFocusOnMenuButton('Basic Menu Button'),

        Keyboard.sKeydown(doc, Keys.space(), { }),
        sWaitForMenuToAppear(),
        sAssertFocusOnItem('Item1'),

        Keyboard.sKeydown(doc, Keys.down(), { }),
        sAssertFocusOnItem('Item2'),

        Keyboard.sKeydown(doc, Keys.down(), { }),
        sAssertFocusOnItem('Nested'),

        Keyboard.sKeydown(doc, Keys.right(), { }),
        sAssertFocusOnItem('Nested menu x 2'),

        Keyboard.sKeydown(doc, Keys.right(), { }),
        sAssertFocusOnItem('Nested menu x 3'),

        Keyboard.sKeydown(doc, Keys.left(), { }),
        sAssertFocusOnItem('Nested menu x 2'),

        Keyboard.sKeydown(doc, Keys.escape(), { }),
        sAssertFocusOnItem('Nested'),

        Keyboard.sKeydown(doc, Keys.escape(), { }),
        sAssertFocusOnMenuButton('Basic Menu Button'),
        sWaitForMenuToDisappear(),

        Keyboard.sKeydown(doc, Keys.enter(), { }),
        sWaitForMenuToAppear(),
        sAssertFocusOnItem('Item1'),

        Keyboard.sKeydown(doc, Keys.up(), { }),
        sAssertFocusOnItem('Nested'),
        Keyboard.sKeydown(doc, Keys.enter(), { }),
        sAssertFocusOnItem('Nested menu x 2'),

        Keyboard.sKeydown(doc, Keys.escape(), { }),
        sAssertFocusOnItem('Nested'),
        Keyboard.sKeydown(doc, Keys.up(), { }),
        Keyboard.sKeydown(doc, Keys.enter(), { }),
        Logger.t(
          'Pressing <enter> on an item without a submenu should trigger it and close the menu',
          GeneralSteps.sequence([
            sWaitForMenuToDisappear(),
            store.sAssertEq('Store should have evidence of item triggered', [ 'menuitem-2 action' ])
          ])
        ),

        store.sClear,
        Step.sync(() => {
          SilverMenubar.focus(menubar);
        }),
        sAssertFocusOnMenuButton('Changes'),

        Keyboard.sKeydown(doc, Keys.escape(), { }),
        store.sAssertEq('Pressing escape in menubar should fire event', [ 'Menubar.escape' ]),

        Log.stepsAsStep('TBA', 'AP-307: Once a menu is expanded, hovering on buttons should switch which menu is expanded', [
          Mouse.sHoverOn(menubar.element(), 'button[role="menuitem"]:contains("Basic Menu Button")'),
          Step.wait(100),
          UiFinder.sNotExists(testContainer.element(), '[role="menu"]'),
          Mouse.sClickOn(menubar.element(), 'button[role="menuitem"]:contains("Changes")'),
          UiFinder.sWaitForVisible(
            'Waiting for changes menu',
            testContainer.element(),
            '.tox-collection__item:contains("Remember me")'
          ),
          sAssertMenuItemGroups('After clicking on "Changes"', [
            [ 'Remember me' ]
          ]),
          Mouse.sHoverOn(menubar.element(), 'button[role="menuitem"]:contains("Basic Menu Button")'),
          UiFinder.sWaitForVisible(
            'Waiting for basic menu',
            testContainer.element(),
            '.tox-collection__item:contains("Item1")'
          ),
          // Focus the menu item, not the toolbar item
          Keyboard.sKeydown(doc, Keys.down(), { }),
          UiFinder.sWaitForVisible(
            'Wait for basic menu to get selected class',
            testContainer.element(),
            '.tox-selected-menu .tox-collection__item:contains("Item1")'
          ),
          // This is failing because tox-selected-menu is not set.
          sAssertMenuItemGroups('After hovering on Basic (after another menu was open)', [
            [ 'Item1' ],
            [ 'Item2', 'Nested menu>' ]
          ])
        ])
      ];
    },
    success,
    failure
  );
});