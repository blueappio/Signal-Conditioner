(function() {

    var gattip = null;

    const SERVICE_UUID = "1234";

    const SHUNT_VOLT_UUID = "1236";
    const BUS_VOLT_UUID = "1237";
    const CURRENT_UUID = "1239";
    const RELAY_UUID = "123B";

    class API {
        constructor() {
            this.isOn = false;
            this.apiUnit = 'mA';
            this.currentValue = 0;
            this.shuntVoltage = 0;
            this.busVoltage = 0;
            this.peripheral = {};

            gattip = navigator.bluetooth.gattip;

            gattip.once('ready', function(gateway) {
                function onScan(peripheral) {
                    api.peripheral = peripheral;
                    console.log('Found peripheral', peripheral.name);
                    gateway.removeListener('scan', onScan);
                    gateway.stopScan(function() {
                        peripheral.connect(function() {
                            api.readCharacteristicValues(peripheral);
                            api.onSuccess('Connected with ' + peripheral.name);
                        });
                    });
                }
                gateway.scan();
                gateway.on('scan', onScan);
            });

            gattip.on('error', function(err) {
                console.log(err);
            });
        }

        /* ------- API Handling Functions ------- */

        readCharacteristicValues(peripheral) {
            api.getRelayStatus();
            api.enableNotifyCurrentChar();
            api.enableNotifyBusChar();
            api.enableNotifyShuntChar();
        };

        getCharacteristic(serv, characteristic) {
            var service = api.peripheral.findService(serv);
            if (service) {
                var char = service.findCharacteristic(characteristic);
                return char;
            }
        };

        toggleRelay(status) {
            if (status) {
                api.relayON();
            } else {
                api.relayOFF();
            }
        };

        relayON() {
            var char = api.getCharacteristic(SERVICE_UUID, RELAY_UUID);
            char.writeValue(function(char) {}, '00');
        };

        relayOFF() {
            var char = api.getCharacteristic(SERVICE_UUID, RELAY_UUID);
            char.writeValue(function(char) {}, '01');
        };

        getRelayStatus() {
            var char = api.getCharacteristic(SERVICE_UUID, RELAY_UUID);
            char.readValue(function(char, value) {
                if (value === '00') { //ON
                    api.isOn = true;
                } else { //OFF
                    api.isOn = false;
                }
            });
        };

        enableNotifyCurrentChar() {
            var value = '';
            var notify_char = api.getCharacteristic(SERVICE_UUID, CURRENT_UUID);
            if (notify_char) {
                notify_char.on('valueChange', function(notify_char) {
                    api.currentValue = api.calcApiReading(notify_char.value) * 0.01;
                    api.currentValue = api.currentValue.toFixed(2);
                    var d = new Date();
                    var currDate = d.getHours()+':'+d.getMinutes()+':'+d.getSeconds();
                    console.log('Current notified at : ', currDate);
                    api.updateUI();
                }, value);
                notify_char.enableNotifications(function(notify_char, value) {
                    console.log('Enabled the notification ', value);
                }, true);
            }
        };

        enableNotifyBusChar() {
            var value = '';
            var notify_char = api.getCharacteristic(SERVICE_UUID, BUS_VOLT_UUID);
            if (notify_char) {
                notify_char.on('valueChange', function(notify_char) {
                    api.busVoltage = api.calcApiReading(notify_char.value) * 0.01;
                    api.busVoltage = api.busVoltage.toFixed(2);
                    api.updateUI();
                }, value);
                notify_char.enableNotifications(function(notify_char, value) {
                    console.log('Enabled the notification ', value);
                }, true);
            }
        };

        enableNotifyShuntChar() {
            var value = '';
            var notify_char = api.getCharacteristic(SERVICE_UUID, SHUNT_VOLT_UUID);
            if (notify_char) {
                notify_char.on('valueChange', function(notify_char) {
                    api.shuntVoltage = api.calcApiReading(notify_char.value) * 0.01;
                    api.shuntVoltage = api.shuntVoltage.toFixed(2);
                    api.updateUI();
                }, value);
                notify_char.enableNotifications(function(notify_char, value) {
                    console.log('Enabled the notification ', value);
                }, true);
            }
        };

        calcApiReading(value) {
            var dataR = value;
            if (dataR) {
                var reading = '' + dataR[0] + dataR[1] + dataR[2] + dataR[3];
                var readingValue = parseInt(reading, 16);
                return readingValue;
            }
        }
    }

    window.api = new API();
})();