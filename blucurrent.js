"use strict";

var BluCurrent = function () {

    var SERVICE_UUID = 0x1234;

    var SHUNT_VOLT_UUID = 0x1236;
    var BUS_VOLT_UUID = 0x1237;
    var CURRENT_UUID = 0x1239;
    var RELAY_UUID = 0x123B;

    function BluCurrent() {
        this.connected = false;
        this.relayCharacteristic = undefined;
        this.relayStatus = undefined;
        this.bluetoothDevice = undefined;
    }

    BluCurrent.prototype.connect = function connect() {

        var self = this;

        var options = {filters: [{services: [SERVICE_UUID]}]};

        return navigator.bluetooth.requestDevice(options)
            .then(function (device) {
                self.bluetoothDevice = device;
                return device.gatt.connect();
            })
            .then(function (server) {
                return server.getPrimaryService(SERVICE_UUID)
            })
            .then(function (service) {
                return Promise.all([
                    service.getCharacteristic(RELAY_UUID)
                        .then(function (characteristic) {
                            self.relayCharacteristic = characteristic;
                            return self.relayCharacteristic.readValue()
                                .then(function (value) {
                                    if (value.getUint8(0) === 0) { //ON
                                        self.relayStatus = true;
                                    } else { //OFF
                                        self.relayStatus = false;
                                    }
                                });
                        }),
                    service.getCharacteristic(CURRENT_UUID)
                        .then(function (characteristic) {
                            return characteristic.startNotifications()
                                .then(function () {
                                    characteristic.addEventListener('characteristicvaluechanged', function (event) {
                                        //todo: generate event
                                        if (self.updateUI) {
                                            self.updateUI(event.target.value, 'current');
                                        }
                                    });
                                });
                        }),
                    service.getCharacteristic(SHUNT_VOLT_UUID)
                        .then(function (characteristic) {
                            return characteristic.startNotifications()
                                .then(function () {
                                    characteristic.addEventListener('characteristicvaluechanged', function (event) {
                                        //todo: generate event
                                        if (self.updateUI) {
                                            self.updateUI(event.target.value, 'shunt');
                                        }
                                    });
                                });
                        }),
                    service.getCharacteristic(BUS_VOLT_UUID)
                        .then(function (characteristic) {
                            return characteristic.startNotifications()
                                .then(function () {
                                    characteristic.addEventListener('characteristicvaluechanged', function (event) {
                                        //todo: generate event
                                        if (self.updateUI) {
                                            self.updateUI(event.target.value, 'bus');
                                        }
                                    });
                                });
                        })
                ]);
            })
            .then(function () {
                self.connected = true;
            });
    }

    BluCurrent.prototype.writeData = function writeData(sendData) {
        if (this.relayCharacteristic) {
            return this.relayCharacteristic.writeValue(sendData);
        }

        return Promise.reject();
    }

    BluCurrent.prototype.disconnect = function disconnect() {
        var self = this;
        if (!self.bluetoothDevice) {
            return Promise.reject();
        }
        return self.bluetoothDevice.disconnect()
            .then(function () {
                self.connected = false;
                self.relayCharacteristic = undefined;
                self.relayStatus = undefined;
                self.bluetoothDevice = undefined;

                return Promise.resolve();
            });

    }

    return BluCurrent;

}();

if (window === undefined) {
    module.exports.BluCurrent = BluCurrent;
}
