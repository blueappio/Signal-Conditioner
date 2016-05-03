(function() {

    var gateway = null;

    const SERVICE_UUID      = "1234";

    const SHUNT_VOLT_UUID   = "1236";
    const BUS_VOLT_UUID     = "1237";
    const CURRENT_UUID      = "1239";
    const RELAY_UUID        = "123B";

    class API {
        constructor() {
            this.isOn = false;
            this.apiUnit = 'mA';
            this.currentValue = 0;
            this.shuntVoltage = 0;
            this.busVoltage = 0;
            this.characteristics = {};

            gateway = navigator.bluetooth.gateway;

            gateway.onstate = function(error) {
                if (gateway.state === C.kPoweredOn) {
                    gateway.scan(true);
                    gateway.isConnectSent = false;
                } else if (gateway.state === C.kPoweredOff) {
                    console.log('Please turn on the Bluetooth');
                } else if (gateway.state === C.kUnsupported) {
                    console.log('Bluetooth Low Energy is not supported with this device.');
                }
            };

            gateway.onscan = function(peripheral, error) {
                if (error) {
                    console.log(error.code + ': ' + error.message);
                    api.onError(error.code + ': ' + error.message);
                    return;
                }
                if(!gateway.isConnectSent){
                    gateway.stopScan();
                    setTimeout(function () { peripheral.connect(); }, 300);
                    gateway.isConnectSent = true;
                }
            };

           gateway.onconnect = function(peripheral, error) {
                if (error) {
                    console.log(error.code + ': ' + error.message);
                    api.onError(error.code + ': ' + error.message);
                    peripheral.connect();
                    return;
                }
                api.onSuccess('Connected with '+peripheral.name);
                peripheral.discoverServices();
            };

            gateway.ondisconnect = function(peripheral, error) {
                if (error && error.message) {
                    console.log(error.message+', Please try again.');
                }                   
            };

            gateway.ondiscoverServices = function(peripheral, error) {
                if (error) {
                    console.log(error.code + ': ' + error.message);
                    api.onError(error.code + ': ' + error.message);
                    return;
                }
                var service = peripheral.services[SERVICE_UUID];
                if (service) {
                    service.discoverCharacteristics();
                }
            };

            gateway.ondiscoverCharacteristics = function(peripheral, service, error) {
                if (error) {
                    console.log(error.code + ': ' + error.message);
                    api.onError(error.code + ': ' + error.message);
                    return;
                }
                api.characteristics = service.characteristics;
                var characteristic;
                characteristic = service.characteristics[CURRENT_UUID];
                if(characteristic && characteristic.properties.Notify && characteristic.properties.Notify.enabled){
                    characteristic.notify(true);
                }
                characteristic = service.characteristics[RELAY_UUID];
                if(characteristic && characteristic.properties.Read && characteristic.properties.Read.enabled){
                    characteristic.read();
                }
                characteristic = service.characteristics[SHUNT_VOLT_UUID];
                if(characteristic && characteristic.properties.Notify && characteristic.properties.Notify.enabled) {
                    characteristic.notify(true);
                }
                characteristic = service.characteristics[BUS_VOLT_UUID];
                if(characteristic && characteristic.properties.Notify && characteristic.properties.Notify.enabled) {
                    characteristic.notify(true);
                }
            };

            gateway.onupdateValue = function(peripheral, service, characteristic, error) {
                if (error) {
                    console.log(error.code + ': ' + error.message);
                    api.onError(error.code + ': ' + error.message);
                    return;
                }
                if (!characteristic) {
                    return;
                }
                if (characteristic.uuid === CURRENT_UUID) {
                    api.currentValue = api.calcApiReading(characteristic.value) * 0.01;
                    api.currentValue = api.currentValue.toFixed(2);
                }
                if (characteristic.uuid === RELAY_UUID) {
                    var relayC = characteristic.value;
                    if(characteristic.value === '00'){    //ON
                        api.isOn = true;
                    }else{                            //OFF
                        api.isOn = false;
                    }
                }
                if (characteristic.uuid === SHUNT_VOLT_UUID) {
                    api.shuntVoltage = api.calcApiReading(characteristic.value) * 0.01;
                    api.shuntVoltage = api.shuntVoltage.toFixed(2);
                }
                if (characteristic.uuid === BUS_VOLT_UUID) {
                    api.busVoltage = api.calcApiReading(characteristic.value) * 0.01;
                    api.busVoltage = api.busVoltage.toFixed(2);
                }
                api.updateUI();
            };

            gateway.onwriteValue = function(peripheral, service, characteristic, error) {
                if (error) {
                    console.log(error.code + ': ' + error.message);
                    api.onError(error.code + ': ' + error.message);
                    return;
                }
            };

            gateway.onerror = function(err_msg) {
                console.log(err_msg);
                //api.onError(err_msg);
            };
        }

        /* ------- API Handling Functions ------- */

        toggleRelay(status){
            if(status){
                api.relayON();
            }else{
                api.relayOFF();
            }
        };

        relayON(){
            api.characteristics[RELAY_UUID].writeWithResType('00',GATTIP.kWriteWithResponse);
        };

        relayOFF(){
            api.characteristics[RELAY_UUID].writeWithResType('01',GATTIP.kWriteWithResponse);
        };

        calcApiReading(value) {
            var dataR = value;
            if(dataR){
                var reading = ''+dataR[0]+dataR[1]+dataR[2]+dataR[3];
                var readingValue = parseInt(reading, 16);
                return readingValue;
            }
        }
    }

  window.api = new API();
})();
