/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var services= [];
var app = {

    // Application Constructor
    initialize: function() {
        app.bindCordovaEvents();
        app.bindUIEvents();
    },
    
    bindCordovaEvents: function() {
        document.addEventListener('bcready', app.onBCReady, false);
		document.addEventListener('deviceconnected', app.onDeviceConnected, false);
		document.addEventListener('devicedisconnected', app.onBluetoothDisconnect, false);
		document.addEventListener('newdevice', app.addNewDevice, false);
		document.addEventListener('bluetoothstatechange', app.onBluetoothStateChange, false);
    },

	onDeviceConnected : function(arg){
		var deviceID = arg.deviceID;
		//alert("device:"+deviceID+" is connected!");
	},
	
    bindUIEvents: function(){
    	$('#scanOnOff').change(app.startORstopScan); 
    },
    
    device_page: function(deviceID){
    	app.device = BC.bluetooth.devices[deviceID];
    	$.mobile.changePage("deviceApps.html","slideup");
    },
    
    startORstopScan: function(){
		var state = $("#scanOnOff").val();
		if(state == 1){
			BC.Bluetooth.StartScan();
		}else if(state == 0){
			BC.Bluetooth.StopScan();
		}
    },
    
    onBCReady: function() {
		if(!BC.bluetooth.isopen){
			if(API !== "ios"){
				BC.Bluetooth.OpenBluetooth(function(){
					BC.Bluetooth.StartScan();
				});
			}else{					
				alert("Please open your bluetooth first.");
			}
		}else{
			BC.Bluetooth.StartScan();
		}
    },
	
	onBluetoothStateChange : function(){
		if(BC.bluetooth.isopen){
			var scanOnOff = $("#scanOnOff");
			scanOnOff[0].selectedIndex = 0;
			scanOnOff.slider("refresh");
		}else{
			BC.Bluetooth.OpenBluetooth(function(){alert("opened!");});
		}
	},
	
	addNewDevice: function(arg){
		var deviceID = arg.deviceID;
		var viewObj	= $("#user_view");
		var liTplObj=$("#li_tpl").clone();
		var newDevice = BC.bluetooth.devices[deviceID];
		$("a",liTplObj).attr("onclick","app.device_page('"+newDevice.deviceID+"')");
		
		liTplObj.show();
		for(var key in newDevice){
			if(key == "isConnected"){
				if(newDevice.isConnected){
					$("[dbField='"+key+"']",liTplObj).html("YES");
				}
				$("[dbField='"+key+"']",liTplObj).html("NO");
			}else{
				$("[dbField='"+key+"']",liTplObj).html(newDevice[key]);
			}
		}	
			
		viewObj.append(liTplObj);
		viewObj.listview("refresh");
	},
	
	onBluetoothDisconnect: function(arg){
		alert("device:"+arg.deviceID+" is disconnected!");
		$.mobile.changePage("index.html","slideup");
	},
	
	onScanStartSuccess: function(list){
		//alert(list);
	},	
	
	onScanStopSuccess: function(result){
		alert(result.mes);
	},	
	
	onGeneralSuccess: function(result){
		alert(result.mes);
	},

    onGeneralError: function(message){
		alert(message.mes);
	},
	
	deviceViewInit: function(){
		var isconnect = app.device.isConnected;
		if(!isconnect){
			$("#connect").show();
		}else{
			$("#disconnect").show();
			app.fillServices();
		}
		//bind events
		$("#connect").click(app.connectDevice);
		$("#disconnect").click(app.disconnectDevice);
        app.connectDevice();
	},
	
	connectDevice: function(){
        app.showLoader("Connecting and discovering services...");
		app.device.connect(app.connectSuccess);
	},
	showLoader : function(message) {
		$.mobile.loading('show', {
                         text: message,
                         textVisible: true,
                         theme: 'a',
                         textonly: true,   
                         html: ""           
                         });
	},
    hideLoader : function(){
		$.mobile.loading('hide');
	},
	connectSuccess: function(message){
		$("#disconnect").show();
		$("#connect").hide();
		
        app.device.prepare(app.operateCharViewInit);
	},
	
	disconnectDevice: function(){
		app.device.disconnect(app.disconnectSuccess);
	},
	
	disconnectSuccess: function(message){
		$("#connect").show();
		$("#disconnect").hide();
		sessionStorage.setItem("isConnected","NO");
	},
		
	operateCharViewInit: function(arg){
        app.hideLoader();
		var serviceIndex = 1;//Defining the corresponding service according to the hardware
		var characterIndex =0;
		var service = app.device.services[serviceIndex];
		var character = service.characteristics[characterIndex];
		
		$("#writeOK").click(function(){		
				var type = $('input:radio[name="writeType"]:checked').val();
				character.write(type,$('#writeValue').val(),app.writeCharSuccess,app.onGeneralError);
            });// 写
			
		$("#writeClear").click(function(){ $('#writeValue').val(''); });//write
		
		$("#subscribe").show().click(function(){ character.subscribe(app.onNotify); });//notify
        $("#unsubscribe").show().click(function(){character.unsubscribe(function(){alert("unsubscribe success!");})});//stop notify
        $("#notifyValue").show();//show notify value
        $("#notifyDate").show();//show notify Date
	},

	readCharSuccess: function(data){
		alert("Read Content(HEX):"+data.value.getHexString()+"\nRead Content(ACSII):"+data.value.getASCIIString()+"\nRead Content(Unicode):"+data.value.getUnicodeString()+"\nRead Time:"+data.date);
	},
	
	writeCharSuccess: function(message){
		alert("write success! message is:"+JSON.stringify(message));
	},
    
    onNotify:function(data){
		$("#notifyValue_hex").html(data.value.getHexString());
		$("#notifyValue_unicode").html(data.value.getUnicodeString());
		$("#notifyValue_ascii").html(data.value.getASCIIString());
		$("#notifyDate").html(data.date);
    },
		
	getConnectedDevice : function(){
		BC.Bluetooth.GetConnectedDevices(function(mes){alert(JSON.stringify(mes));},function(mes){alert(JSON.stringify(mes));});
	},
	
	getRSSI : function(){
		app.device.getRSSI(app.getRSSISuccess);
	},
	
	getRSSISuccess : function(data){
		alert(JSON.stringify(data));
	},
    createService : function(){
        
		var service = BC.Bluetooth.CreateService("0000ffe0-0000-1000-8000-00805f9b34fb");
		var property1 = ["notify","write"];
        var property2 = ["read","write"];
		var permission = ["read","write"];
		var onMyWriteRequestName = "myWriteRequest";
		var onMyReadRequestName = "myReadRequest";
		var character1 = BC.Bluetooth.CreateCharacteristic("0000ffe1-0000-1000-8000-00805f9b34fb","01","Hex",property1,permission);
		var character2 = BC.Bluetooth.CreateCharacteristic("0000fff2-0000-1000-8000-00805f9b34fb","00","Hex",property2,permission);
		var descriptor1 = BC.Bluetooth.CreateDescriptor("00002901-0000-1000-8000-00805f9b34fb","00","Hex",permission);
		var descriptor2 = BC.Bluetooth.CreateDescriptor("00002902-0000-1000-8000-00805f9b34fb","08","Hex",permission);
		character1.addDescriptor(descriptor1);
		character1.addDescriptor(descriptor2);
		service.addCharacteristic(character1);
		service.addCharacteristic(character2);
		BC.Bluetooth.AddService(service,app.addServiceSusscess,app.addServiceError);
		
		services[0] = service;
	},
	
	addServiceSusscess : function(){
		alert("add service success!");
	},
    
	addServiceError : function(){
		alert("add service error!");
	},
	
	removeServiceSuccess : function(){
		alert("remove service success!");
	},
	
	removeServiceError : function(){
		alert("remove service error!");
	},
};
