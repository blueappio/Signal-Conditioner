"use strict";

var BluCurrent = function() {

    var CURRENT_SERVICE_UUID = 'e4dc0001-29c4-11e7-a2cb-354fddf992ab';

    var SHUNT_VOLT_UUID = 'e4dc0003-29c4-11e7-a2cb-354fddf992ab';
    var BUS_VOLT_UUID = 'e4dc0004-29c4-11e7-a2cb-354fddf992ab';
    var CURRENT_UUID = 'e4dc0006-29c4-11e7-a2cb-354fddf992ab';


    var RELAY_SERVICE = '299f0001-094d-4f6d-b472-3a25bf4c3916';
    var RELAY_UUID = '299f0002-094d-4f6d-b472-3a25bf4c3916';

    function BluCurrent() {
        this.connected = false;
        this.relayCharacteristic = undefined;
        this.relayStatus = undefined;
        this.bluetoothDevice = undefined;
        this.hasRelayCharacteristic = false;
    }

    BluCurrent.prototype.connect = function connect() {

        var self = this;

        var options = { filters: [{ services: [CURRENT_SERVICE_UUID] }] };

        return navigator.bluetooth.requestDevice(options)
            .then(function(device) {
                self.bluetoothDevice = device;
                return device.gatt.connect();
            })
            .then(function(server) {
                return Promise.all([
                        server.getPrimaryService(CURRENT_SERVICE_UUID)
                        .then(function(service) {
                            return Promise.all([
                                // service.getCharacteristic(RELAY_UUID)
                                // .then(function(characteristic) {
                                //     self.relayCharacteristic = characteristic;
                                //     self.hasRelayCharacteristic = true;
                                //     return self.relayCharacteristic.readValue()
                                //         .then(function(value) {
                                //             if (value.getUint8(0) === 0) { //ON
                                //                 self.relayStatus = true;
                                //             } else { //OFF
                                //                 self.relayStatus = false;
                                //             }
                                //         });
                                // }, function(error) {
                                //     console.warn('Relay characteristic not found');
                                //     Promise.resolve(true);
                                // }),
                                service.getCharacteristic(CURRENT_UUID)
                                .then(function(characteristic) {
                                    return characteristic.startNotifications()
                                        .then(function() {
                                            characteristic.addEventListener('characteristicvaluechanged', function(event) {
                                                //todo: generate event
                                                if (self.updateUI) {
                                                    self.updateUI(event.target.value, 'current');
                                                }
                                            });
                                        });
                                }, function(error) {
                                    console.warn('Current characteristic not found');
                                    Promise.resolve(true);
                                }),
                                service.getCharacteristic(SHUNT_VOLT_UUID)
                                .then(function(characteristic) {
                                    return characteristic.startNotifications()
                                        .then(function() {
                                            characteristic.addEventListener('characteristicvaluechanged', function(event) {
                                                //todo: generate event
                                                if (self.updateUI) {
                                                    self.updateUI(event.target.value, 'shunt');
                                                }
                                            });
                                        });
                                }, function(error) {
                                    console.warn('Shunt Volt characteristic not found');
                                    Promise.resolve(true);
                                }),
                                service.getCharacteristic(BUS_VOLT_UUID)
                                .then(function(characteristic) {
                                    return characteristic.startNotifications()
                                        .then(function() {
                                            characteristic.addEventListener('characteristicvaluechanged', function(event) {
                                                //todo: generate event
                                                if (self.updateUI) {
                                                    self.updateUI(event.target.value, 'bus');
                                                }
                                            });
                                        });
                                }, function(error) {
                                    console.warn('Bus Volt characteristic not found');
                                    Promise.resolve(true);
                                })
                            ]);
                        }, function(error) {
                            console.warn('Current Service not found');
                            Promise.resolve(true);
                        }),
                        server.getPrimaryService(RELAY_SERVICE)
                        .then(function(service) {
                            return service.getCharacteristic(RELAY_UUID)
                                .then(function(characteristic) {
                                    self.relayCharacteristic = characteristic;
                                    self.hasRelayCharacteristic = true;
                                    return self.relayCharacteristic.readValue()
                                        .then(function(value) {
                                            if (value.getUint8(0) === 0) { //ON
                                                self.relayStatus = true;
                                            } else { //OFF
                                                self.relayStatus = false;
                                            }
                                        });
                                }, function(error) {
                                    console.warn('Relay characteristic not found');
                                    Promise.resolve(true);
                                });
                        }, function(error) {
                            console.warn('Relay Service not found');
                            Promise.resolve(true);
                        })
                    ])
                    .then(function() {
                        self.connected = true;
                    });
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
            .then(function() {
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