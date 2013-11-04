describe('toggle.edit.mode', function () {

    beforeEach(module('dispatcher'));

    describe('toggleEditMode directive', function() {
        var scope, directive, dispatcher, registry;

        beforeEach(inject(function(topicMessageDispatcherHelper, topicMessageDispatcher) {
            scope = {};
            registry = {
                subscribe: function (topic, callback) {
                    registry[topic] = callback;
                }
            };
            dispatcher = topicMessageDispatcherHelper;
            directive = ToggleEditModeDirectiveFactory(topicMessageDispatcher, registry);
        }));

        it('restricted to', function () {
            expect(directive.restrict).toEqual('E');
        });

        it('template url', function () {
            expect(directive.templateUrl).toEqual('app/partials/toggle-edit-mode.html');
        });

        describe('on link', function () {
            beforeEach(function () {
                directive.link(scope);
            });

            describe('enable edit mode', function () {
                beforeEach(function () {
                    scope.toggleEditMode();
                });

                it('raise toggle edit mode enabled', function () {
                    expect(dispatcher['edit.mode']).toEqual(true);
                });
            });

            describe('disable edit mode', function () {
                beforeEach(function () {
                    scope.editMode = true;
                    scope.toggleEditMode();
                });

                it('raise toggle edit mode disabled', function () {
                    expect(dispatcher['edit.mode']).toEqual(false);
                });
            });

            describe('when edit mode enabled and checkpoint.signout received', function () {
                beforeEach(function () {
                    scope.toggleEditMode();
                });

                it('edit mode should be enabled', function () {
                    expect(scope.editMode).toEqual(true);
                });

                it('disable edit mode', function () {
                    registry['checkpoint.signout']();

                    expect(scope.editMode).toEqual(false);
                    expect(dispatcher['edit.mode']).toEqual(false);
                });
            });
        });

    });
});