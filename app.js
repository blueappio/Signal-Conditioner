var app;
(function () {
    app = angular.module('blucurrent', ['ngMaterial'])
        .config(function ($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('pink');
            $mdThemingProvider.theme('success-toast');
            $mdThemingProvider.theme('error-toast');

            $mdThemingProvider.alwaysWatchTheme(true);
        })
})();

app.service('bluCurrentService', function () {
    return new BluCurrent(navigator.bluetooth);
});

app.controller('mainController', function ($scope, $mdToast, $mdDialog, bluCurrentService) {

    $scope.blucurrent = bluCurrentService;

    function goodToast(message) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(message)
                .position('top')
                .theme("success-toast")
                .hideDelay(2500)
        );
    };

    function badToast(message) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(message)
                .position('top')
                .theme('error-toast')
                .hideDelay(2500)
        );
    };

    function showLoadingIndicator($event, text) {
        var parentEl = angular.element(document.body);
        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            clickOutsideToClose: false,
            template: '<md-dialog style="width: 250px;top:95px;margin-top: -170px;" aria-label="loadingDialog" ng-cloak>' +
            '<md-dialog-content>' +
            '<div layout="row" layout-align="center" style="padding: 40px;">' +
            '<div style="padding-bottom: 20px;">' +
            '<md-progress-circular class="md-accent md-hue-1" md-mode="indeterminate" md-diameter="40" style="right: 20px;bottom: 10px;">' +
            '</md-progress-circular>' +
            '</div>' +
            '</div>' +
            '<div layout="row" layout-align="center" style="padding-bottom: 20px;">' +
            '<label>' + text + '</label>' +
            '</div>' +
            '</md-dialog-content>' +
            '</md-dialog>',
            locals: {
                items: $scope.items
            },
            controller: DialogController
        });
        function DialogController($scope, $mdDialog, items) {
            $scope.items = items;
            $scope.closeDialog = function () {
                $mdDialog.hide();
            }
        }
    }

    function dismissLoadingIndicator() {
        $mdDialog.cancel();
    };

    $scope.toggleRelay = function () {
        var bytes = [];
        if ($scope.isOn) {
            $scope.blucurrent.relayStatus = true;
            bytes.push(parseInt(00, 16));
        } else {
            $scope.blucurrent.relayStatus = false;
            bytes.push(parseInt(01, 16));
        }
        $scope.blucurrent.writeData(bytes)
            .then(function () {
                $scope.status = 'Relay toggled success';
            })
            .catch(function (error) {
                badToast('Unable to toggle the Relay');
            });
    };

    $scope.blucurrent.updateUI = function (value, notifyChar) {
        $scope.isOn = $scope.blucurrent.relayStatus;

        var tmpArray = new Uint8Array(value.buffer);
        var tempData = '';
        for (var i = 0; i < tmpArray.length; i++) {
            tempData = tempData + tmpArray[i].toString(16);
        }
        tempData = parseInt(tempData, 16);
        tempData = tempData * 0.01;
        tempData = tempData.toFixed(2);

        if (notifyChar === 'current') {
            $scope.currentValue = tempData;
        } else if (notifyChar === 'shunt') {
            $scope.shuntVoltage = tempData;
        } else if (notifyChar === 'bus') {
            $scope.busVoltage = tempData;
        }
        $scope.$apply();
    };

    $scope.onConnect = function () {
        showLoadingIndicator('', 'Connecting ....');
        $scope.blucurrent.connect()
            .then(function () {
                dismissLoadingIndicator();
                goodToast('Connected...');
            })
            .catch(function (error) {
                dismissLoadingIndicator();
                console.error('Argh!', error, error.stack ? error.stack : '');
                badToast('Unable to connect.');
            });
    }

    if (!navigator.bluetooth) {
        badToast('Bluetooth not supported, which is required.');
    } else if (navigator.bluetooth.referringDevice) {
        $scope.onConnect();
    }

});