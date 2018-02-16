/*

KotivoLib.js for server-side systems
Author: Ville-Pekka Lahti
*/
function isNodejs()
{
	if (typeof window === 'undefined')
	{
		return true;
	}
	else
	{
		return false;
	}
}
if (isNodejs())
{
	var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
	var btoa = require("btoa");
}


function KotivoAPIcall(type, call, params)
{
	var failpacket;
	var url = "https://beta.kotivo.fi/api/v1/" + call + "/";
	var authorizationBasic = btoa(username + ":" + password);
	var xhr = new XMLHttpRequest();
	//console.log("PUT:"+url);
	xhr.open(type, url, false);
	xhr.setRequestHeader("Content-type", "application/json");
	xhr.setRequestHeader('Authorization', 'Basic ' + authorizationBasic);
	//console.log("XHR.send = "+JSON.stringify(params));
	if (typeof params === 'object') xhr.send(JSON.stringify(params));
	else xhr.send(params);
	try
	{
		var parsed = JSON.parse(xhr.responseText);
		parsed.debugthing = [xhr.status, parsed.success, "!!!!!!!!" + JSON.stringify(parsed)];
	}
	catch (e)
	{
		console.log(JSON.stringify(xhr));
		failpacket = {
			success: false,
			msg: "Server bugasee: " + xhr.responseText,
			data:
			{},
			code: 599
		};
		var parsed = failpacket;
	}
	if (parsed.success === undefined || (parsed != -1 && parsed['data'] === undefined))
	{
		//console.log(JSON.stringify(xhr.status))
		return {
			data: parsed.data,
			msg: parsed.msg,
			code: xhr.status
		};
	}
	if (parsed == failpacket && parsed['success'] == true) return {
		msg: "JSON parse error! No data!"
	};
	// jos parsiminen ei onnistu, tulee virhe
	//var tmp = JSON.parse(xhr.responseText)['data'];
	//console.log(xhr.responseText);
	try
	{
		return parsed;
	}
	catch (err)
	{
		return xhr.responseText;
	}
	if (("" + e).indexOf("SyntaxError") !== -1)
	{
		return {
			code: -99
		};
	}
	else
	{
		console.log(e);
		console.log(JSON.stringify(e) + "\nMaybe a CORS error? :) ");
		return {
			code: -98
		};
	}
	//console.log(xhr.status);
	//console.log(xhr.statusText);
	//console.log(my_dump(xhr));
	try
	{
		var jr = JSON.parse(xhr.responseText);
		jr.code = xhr.status || "No response code!";
		return jr;
	}
	catch (e)
	{
		return xhr.responseText;
	}
}

function KotivoGetControllers()
{
	var conts = KotivoAPIcall("GET", "controllers").data;
	var controllers = [];
	var c = 0;
	for (var key in conts)
	{
		if (conts.hasOwnProperty(key))
		{
			controllers[c] = conts[key].id;
			c++;
		}
	}
	return controllers;
}

function KotivoGetController(controller_id)
{
	return KotivoAPIcall("GET", "controllers/"+controller_id).data;
}

function KotivoGetModules(controller)
{
	var mods = KotivoAPIcall("GET", "controllers/" + controller + "/modules").data;
	var modules = [];
	var c = 0;
	for (var key in mods)
	{
		if (mods.hasOwnProperty(key))
		{
			modules[c] = mods[key].id;
			c++;
		}
	}
	return modules;
}

function KotivoLogin(u, p)
{
	return KotivoAPIcall("PUT", "accounts/login",
	{
		username: u,
		password: p
	}).data.id | 0;
}

function KotivoGetControllersAndModules()
{
	login(username, password);
	var controllers = KotivoGetControllers();
	var modules = {};
	for (var i = 0; i < controllers.length; i++)
	{
		var m = KotivoGetModules(controllers[i]);
		if (m != []) modules[controllers[i]] = m;
		//console.log(modules[controllers[i]]);
	}
	return modules;
}

function KotivoGetModuleValues(c, m)
{
	return KotivoAPIcall("GET", "controllers/" + c + "/modules/" + m).data;
}

function KotivoGetModuleValuesByList(list)
{
	var contsdata = {};
	for (var k in list)
	{
		if (list.hasOwnProperty(k))
		{
			var modsdata = {};
			for (var m in list[k])
			{
				if (list[k].hasOwnProperty(m))
				{
					modsdata[list[k][m]] = KotivoGetModuleValues(k, list[k][m]);
					//console.log(k,list[k][m]);
				}
			}
			contsdata[k] = modsdata;
		}
	}
	return contsdata;
}

function comparer(otherArray)
{
	return function(current)
	{
		return otherArray.filter(function(other)
		{
			return other.value == current.value && other.display == current.display
		}).length == 0;
	}
}

function KotivoCheckDifference(timeout)
{
	if (timeout > 0)
	{}
	else
	{
		timeout = -1;
	}
	var uusi = KotivoGetModuleValuesByList(controllers);
	for (var c in uusi)
	{
		for (var cc in exval)
		{
			if (c == cc)
			{
				for (m in uusi[c])
				{
					for (mm in exval[cc])
					{
						if (m == mm)
						{
							for (var prop in uusi[c][m])
							{
								for (var pprop in exval[cc][mm])
								{
									if (prop == pprop)
									{
										if (uusi[c][m][prop] != exval[cc][mm][pprop])
										{
											if (typeof uusi[c][m][prop] != 'object')
											{
												console.log(c, m, prop, uusi[c][m][prop], "!=", exval[cc][mm][pprop]);
											}
											else
											{
												for (var subprop in uusi[c][m][prop])
												{
													for (var ssubprop in exval[cc][mm][pprop])
													{
														if (subprop == ssubprop)
														{
															if (uusi[c][m][prop][subprop] != exval[cc][mm][pprop][ssubprop])
															{
																if (typeof uusi[c][m][prop] != 'object')
																{
																	console.log(c, m, prop, subprop, uusi[c][m][prop][subprop], "!=", exval[cc][mm][pprop][ssubprop]);
																}
																else
																{
																	for (var subsubprop in uusi[c][m][prop][subprop])
																	{
																		for (var ssubsubprop in exval[cc][mm][pprop][ssubprop])
																		{
																			if (subsubprop == ssubsubprop)
																			{
																				if (uusi[c][m][prop][subprop][subsubprop] != exval[cc][mm][pprop][ssubprop][ssubsubprop])
																				{
																					console.log(c, m, prop, subprop, subsubprop, uusi[c][m][prop][subprop][subsubprop], "!=", exval[cc][mm][pprop][ssubprop][ssubsubprop]);
																				}
																			}
																		}
																	}
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
	exval = uusi;
	console.log(timeout);
	if (timeout != -1) setTimeout(function()
	{
		KotivoCheckDifference(timeout);
	}, timeout);
}