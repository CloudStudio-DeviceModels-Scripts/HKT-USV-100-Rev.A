//Test: 02 00 00 00 00 01 20 67 01 C0 06 01  - Temperature: 0D21000F - Battery: 08660101
function parseUplink(device, payload) {

    var payloadb = payload.asBytes();
    var decoded = Decoder(payloadb, payload.port)
    env.log(decoded);

    // Store Cumulative flow
    if (decoded.Cumulative_flow != null) {
        var sensor1 = device.endpoints.byAddress("1");

        if (sensor1 != null)
            sensor1.updateFlowSensorValueUnits(decoded.Cumulative_flow);
    };

   // Store Equipment Status
    if (decoded.Equipment_status != null) {
        var sensor2 = device.endpoints.byAddress("2");

        if (sensor2 != null)
            sensor2.updateIASSensorStatus(decoded.Equipment_status);
    };
  // Store Equipment Alarm
    if (decoded.Equipment_alarm != null) {
        var sensor3 = device.endpoints.byAddress("3");

        if (sensor3 != null)
            sensor3.updateIASSensorStatus(decoded.Equipment_alarm);
    };
// Store Temperature
    if (decoded.Current_Temperature != null) {
        var sensor4 = device.endpoints.byAddress("4");

        if (sensor4 != null)
            sensor4.updateTemperatureSensorStatus(decoded.Current_Temperature);
    };


    // Store Battery
    if (decoded.battery_voltage != null) {
        var sensor4 = device.endpoints.byAddress("5");

        if (sensor4 != null)
            sensor4.updateVoltageSensorStatus(decoded.battery_voltage);
             device.updateDeviceBattery({ voltage : decoded.battery_voltage });
    };
   
    
}

function buildDownlink(device, endpoint, command, payload) 
{ 
	// This function allows you to convert a command from the platform 
	// into a payload to be sent to the device.
	// Learn more at https://wiki.cloud.studio/page/200

	// The parameters in this function are:
	// - device: object representing the device to which the command will
	//   be sent. 
	// - endpoint: endpoint object representing the endpoint to which the 
	//   command will be sent. May be null if the command is to be sent to 
	//   the device, and not to an individual endpoint within the device.
	// - command: object containing the command that needs to be sent. More
	//   information at https://wiki.cloud.studio/page/1195.

	// This example is written assuming a device that contains a single endpoint, 
	// of type appliance, that can be turned on, off, and toggled. 
	// It is assumed that a single byte must be sent in the payload, 
	// which indicates the type of operation.

/*
	 payload.port = 25; 	 	 // This device receives commands on LoRaWAN port 25 
	 payload.buildResult = downlinkBuildResult.ok; 

	 switch (command.type) { 
	 	 case commandType.onOff: 
	 	 	 switch (command.onOff.type) { 
	 	 	 	 case onOffCommandType.turnOn: 
	 	 	 	 	 payload.setAsBytes([30]); 	 	 // Command ID 30 is "turn on" 
	 	 	 	 	 break; 
	 	 	 	 case onOffCommandType.turnOff: 
	 	 	 	 	 payload.setAsBytes([31]); 	 	 // Command ID 31 is "turn off" 
	 	 	 	 	 break; 
	 	 	 	 case onOffCommandType.toggle: 
	 	 	 	 	 payload.setAsBytes([32]); 	 	 // Command ID 32 is "toggle" 
	 	 	 	 	 break; 
	 	 	 	 default: 
	 	 	 	 	 payload.buildResult = downlinkBuildResult.unsupported; 
	 	 	 	 	 break; 
	 	 	 } 
	 	 	 break; 
	 	 default: 
	 	 	 payload.buildResult = downlinkBuildResult.unsupported; 
	 	 	 break; 
	 }
*/

}

function easy_decode(bytes) {
    var decoded = {};

    if (bytes[0] === 0x00 && bytes.length === 3) {
        if (bytes[2] === 0x00) {
            decoded.command = readUInt8LE(bytes.slice(0, 1));
            decoded.interrupt = readUInt8LE(bytes.slice(1, 2));
            decoded.frameidentification = readUInt8LE(bytes.slice(2, 3));
        }
        else if (bytes[2] === 0x01) {
            decoded.answer = readUInt8LE(bytes.slice(0, 1));
            decoded.response = readUInt8LE(bytes.slice(1, 2));
            decoded.frameidentification = readUInt8LE(bytes.slice(2, 3));
        }
    }
    else if (bytes[0] === 0x01 && bytes.length === 3) {
        decoded.answer = readUInt8LE(bytes.slice(0, 1));
        decoded.response = readUInt8LE(bytes.slice(1, 2));
        decoded.frameidentification = readUInt8LE(bytes.slice(2, 3));
    }
    else if (bytes[0] === 0x02) {
        decoded.command = readUInt8LE(bytes.slice(0, 1));
        decoded.Cumulative_flow = readUInt32LE_SWP32(bytes.slice(1, 5));
        decoded.Equipment_status = readUInt8LE(bytes.slice(5, 6));
        decoded.Equipment_alarm = readUInt8LE(bytes.slice(6, 7));
        decoded.Electricity = readUInt16LE_SWP16(bytes.slice(7, 9)) / 100;
        decoded.Downlink_signal_intensity = readInt8LE(bytes.slice(9, 10));
        decoded.SNR = readInt8LE(bytes.slice(10, 11));
        decoded.Balance = readUInt32LE_SWP32(bytes.slice(11, 15));
        decoded.frameidentification = readUInt8LE(bytes.slice(15, 16));
    }
    else if (bytes[bytes.length - 1] === 0x09) {

        decoded.IMEI = readUint64_ID(bytes.slice(0, 8)).toString(16);

        if (bytes.length === 11) {
            decoded.history_data = readUInt8LE(bytes.slice(8, 9));
            decoded.command = readUInt8LE(bytes.slice(9, 10));
            decoded.frameidentification = readInt8LE(bytes.slice(10, 11));
        }
        else if (bytes.length > 11) {
            decoded.command = readUInt8LE(bytes.slice(8, 9));
            decoded.Timestamp = readUInt32LE_SWP32(bytes.slice(9, 13));
            formatDate(decoded.Timestamp);
            decoded.Historical_cumulative_flows = {};
            var Number;
            Number = (bytes.length - 2 - 4 - 8) / 4;
            for (k = 1; k <= Number; k++) {
                decoded.Historical_cumulative_flows[k] = readUInt32LE_SWP32(bytes.slice(13 + 4 * (k - 1), 17 + 4 * (k - 1))) / 1000;
            }
        }
        decoded.frameidentification = readUInt8LE(bytes.slice(bytes.length - 1, bytes.length));
    }
    else if (bytes[0] === 0x09) {
        decoded.command = readUInt8LE(bytes.slice(0, 1));
        decoded.Equipment_status = readUInt8LE(bytes.slice(1, 2));
        decoded.frameidentification = readUInt8LE(bytes.slice(2, 3));
    }
    else if (bytes[0] === 0x06) {
        decoded.command = readUInt8LE(bytes.slice(0, 1));
        decoded.Reporting_cycle = readUInt16LE_SWP16(bytes.slice(1, 3));
        decoded.frameidentification = readUInt8LE(bytes.slice(3, 4));
    }
    else if (bytes[0] === 0x07) {
        decoded.command = readUInt8LE(bytes.slice(0, 1));
        decoded.Point_Reporting_Time_H = readUInt8LE(bytes.slice(1, 2));
        decoded.Point_Reporting_Time_M = readUInt8LE(bytes.slice(2, 3));
        decoded.frameidentification = readUInt8LE(bytes.slice(3, 4));
    }
    else if (bytes[0] === 0x08) {
        if (bytes.length === 3) {
            decoded.command = readUInt8LE(bytes.slice(0, 1));
            decoded.Electricity = readUInt8LE(bytes.slice(1, 2));
            decoded.frameidentification = readUInt8LE(bytes.slice(2, 3));
        }
        else if (bytes.length === 4) {
            decoded.command = readUInt8LE(bytes.slice(0, 1));
            decoded.battery_voltage = readUInt16LE_SWP16(bytes.slice(1, 3)) / 100;
            decoded.frameidentification = readUInt8LE(bytes.slice(3, 4));
        }

    }
    else if (bytes[bytes.length - 1] === 0x0D) {
        decoded.IMEI = readUint64_ID(bytes.slice(0, 8)).toString(16);
        decoded.response = readUInt8LE(bytes.slice(8, 9));
        decoded.answer = readUInt8LE(bytes.slice(9, 10));
        decoded.frameidentification = readUInt8LE(bytes.slice(10, 11));
    }
    else if (bytes[0] === 0x09) {
        decoded.command = readUInt8LE(bytes.slice(0, 1));
        decoded.Equipment_status = readUInt8LE(bytes.slice(1, 2)).toString(2);
        decoded.frameidentification = readUInt8LE(bytes.slice(2, 3));
    }
    else if (bytes[0] === 0x0A) {
        decoded.command = readUInt8LE(bytes.slice(0, 1));
        decoded.Equipment_alarm = readUInt8LE(bytes.slice(1, 2)).toString(2);
        decoded.frameidentification = readUInt8LE(bytes.slice(2, 3));
    }
    else if (bytes[0] === 0x0B) {
        decoded.command = readUInt8LE(bytes.slice(0, 1));
        decoded.main_version = bytes[1] >> 4;
        decoded.second_version = bytes[1] & 15;
        decoded.frameidentification = readUInt8LE(bytes.slice(2, 3));
    }
    else if (bytes[0] === 0x0D) {
        decoded.command = readUInt8LE(bytes.slice(0, 1));
        decoded.Current_Temperature = readUInt16LE_SWP16(bytes.slice(1, 3)) / 10;
        decoded.frameidentification = readUInt8LE(bytes.slice(3, 4));
    }
    else if (bytes[bytes.length - 1] === 0x10) {
        decoded.IMEI = readUint64_ID(bytes.slice(0, 8)).toString(16);
        decoded.command = readUInt8LE(bytes.slice(8, 9));
        decoded.Time = getDate_48(bytes.slice(9, 15));
        decoded.frameidentification = readUInt8LE(bytes.slice(15, 16));
    }
    else if (bytes[0] === 0xE0) {
        decoded.command = readUInt8LE(bytes.slice(0, 1));
        decoded.pulse_coefficient = readUInt16LE_SWP16(bytes.slice(1, 3));
        decoded.frameidentification = readUInt8LE(bytes.slice(3, 4));
    }
    else if (bytes[0] === 0xE1) {
        decoded.command = readUInt8LE(bytes.slice(0, 1));
        decoded.Mode = readUInt8LE(bytes.slice(1, 2));
        decoded.oggerswitch = readInt8LE(bytes.slice(2, 3));
        decoded.frameidentification = readUInt8LE(bytes.slice(3, 4));
    }
    else if (bytes[0] === 0xFF) {
        decoded.IMEI = readUint64_ID(bytes.slice(0, 8)).toString(16);
        decoded.command = readInt8LE(bytes.slice(8, 9));
        decoded.frameidentification = readUInt8LE(bytes.slice(9, 10));
    }

    return decoded;

}

/* ******************************************
 * bytes to number
 ********************************************/
function readUInt8LE(byte) {
    return (byte & 0xFF);
}

function readUInt8LE_SWP8(byte) {
    return (value & 0xFF);
}

function readInt8LE(byte) {
    var ref = readUInt8LE(byte);
    return (ref > 0x7F) ? ref - 0x100 : ref;
}

function readUInt16LE(byte) {
    var value = (byte[0] << 8) + byte[1];
    return (value & 0xFFFF);
}

function readUInt16LE_SWP16(byte) {
    var value = (byte[1] << 8) + byte[0];
    return (value & 0xFFFF);
}

function readInt16LE(byte) {
    var ref = readUInt16LE(byte);
    return (ref > 0x7FFF) ? ref - 0x10000 : ref;
}

function readUInt32LE(byte) {
    var value = (byte[0] << 24) + (byte[1] << 16) + (byte[2] << 8) + byte[3];
    return (value & 0xFFFFFFFF);
}

function readUInt32LE_SWP32(byte) {
    var value = (byte[3] << 24) + (byte[2] << 16) + (byte[1] << 8) + byte[0];
    return (value & 0xFFFFFFFF);
}

function readInt32LE(byte) {
    var ref = readUInt32LE(byte);
    return (ref > 0x7FFFFFFF) ? ref - 0x100000000 : ref;
}

function readInt32LE_SWP32(byte) {
    var ref = readUInt32LE_SWP32(byte);
    return (ref > 0x7FFFFFFF) ? ref - 0x100000000 : ref;
}

function readDoubleLE(byte) {
    var n;
    var Exponent;
    if (byte[7] & 0xF0)//求阶码与阶数
    {
        byte[7] = byte[7] & 0x7F;
        Exponent = (byte[7] << 4) + ((byte[6] & 0xF0) >> 4);
        n = Exponent - 1023;
    }
    else {
        Exponent = (byte[7] << 4) + ((byte[6] & 0xF0) >> 4);
        n = Exponent - 1023;
    }
    var integer = ((byte[6] & 0x0F) << 24) + (byte[5] << 16) + (byte[4] << 8) + byte[3];
    var Integer = (integer >> (28 - n)) + (0x01 << n);
    var decimal = (integer - ((integer >> (28 - n)) << (28 - n))) / Math.pow(2, 28 - n);
    return Integer + decimal;

}

function readUint64_ID(byte) {
    var ID;
    ID = byte[0] * Math.pow(2, 56) + byte[1] * Math.pow(2, 48) + byte[2] * Math.pow(2, 40) + byte[3] * Math.pow(2, 32) + byte[4] * Math.pow(2, 24) + byte[5] * Math.pow(2, 16) + byte[6] * Math.pow(2, 8) + byte[7];
    return ID;
}


function readX16LE(byte) {
    var value = (byte[0] << 8) + byte[1];
    return (value & 0xFFFF);
}

function readX16LE_SWP32(byte) {
    var value = (byte[1] << 8) + byte[0];
    return (value & 0xFFFF);
}

function readS16LE(byte) {
    var value = (byte[0] << 8) + byte[1];
    return (value & 0xFFFF);
}

function readS16LE_SWP32(byte) {
    var value = (byte[1] << 8) + byte[0];
    return (value & 0xFFFF);
}

function formatDate(time, format = 'YY-MM-DD hh:mm:ss') {
    var date = new Date(time * 1000);

    var year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate(),
        hour = date.getHours(),
        min = date.getMinutes(),
        sec = date.getSeconds();
    var preArr = Array.apply(null, Array(10)).map(function (elem, index) {
        return '0' + index;
    });

    var newTime = format.replace(/YY/g, year)
        .replace(/MM/g, preArr[month] || month)
        .replace(/DD/g, preArr[day] || day)
        .replace(/hh/g, preArr[hour] || hour)
        .replace(/mm/g, preArr[min] || min)
        .replace(/ss/g, preArr[sec] || sec);
    console.log(newTime);
    return newTime;
}
function getDate_48(byte) {
    var Y, M, D, h, m, s;
    var Date;
    Y = byte[0] + 2000 + "-";
    M = byte[1] + "-";
    D = byte[2] + "  ";
    h = byte[3] + ":";
    m = byte[4] + ":";
    s = byte[5];
    Date = Y + M + D + h + m + s;
    return Date;
}

function Decoder(bytes, port) {
    return easy_decode(bytes);
}