import { b as get_store_value, c as create_ssr_component, a as subscribe, o as onDestroy, e as escape, v as validate_component, d as add_attribute, f as each, s as setContext, g as getContext, h as set_store_value, n as null_to_empty } from "../../chunks/index2.js";
import "webmidi";
import { w as writable } from "../../chunks/index.js";
import { gt } from "semver";
const logger = (...obj) => {
};
const isEquivalent = (configA, configB) => {
  let optionEquivalents = configA.faderBlink == configB.faderBlink && configA.accelBlink == configB.accelBlink && configA.controllerFlip == configB.controllerFlip && configA.midiThru == configB.midiThru && configA.midiMode == configB.midiMode && configA.dxMode == configB.dxMode && configA.pageNumber == configB.pageNumber;
  if ("i2cLeader" in configA || "i2cLeader" in configB) {
    optionEquivalents = optionEquivalents && configA.i2cLeader == configB.i2cLeader;
  }
  if ("fadermax" in configA || "fadermax" in configB) {
    optionEquivalents = optionEquivalents && configA.faderMax == configB.faderMax && configA.faderMin == configB.faderMin;
  }
  let usbEquivalent = true;
  let trsEquivalent = true;
  configA.usbControls.forEach((control, i) => {
    const otherControl = configB.usbControls[i];
    if (control.channel != otherControl.channel || control.cc != otherControl.cc) {
      usbEquivalent = false;
    }
  });
  configA.trsControls.forEach((control, i) => {
    const otherControl = configB.trsControls[i];
    if (control.channel != otherControl.channel || control.cc != otherControl.cc) {
      trsEquivalent = false;
    }
  });
  let usbButtonEquivalent = true;
  let trsButtonEquivalent = true;
  configA.usbButtons.forEach((button, i) => {
    const otherButton = configB.usbButtons[i];
    if (button.channel != otherButton.channel || button.mode != otherButton.mode || button.paramA != otherButton.paramA || button.paramB != otherButton.paramB) {
      usbButtonEquivalent = false;
    }
  });
  configA.trsButtons.forEach((button, i) => {
    const otherButton = configB.trsButtons[i];
    if (button.channel != otherButton.channel || button.mode != otherButton.mode || button.paramA != otherButton.paramA || button.paramB != otherButton.paramB) {
      trsButtonEquivalent = false;
    }
  });
  return optionEquivalents && usbEquivalent && trsEquivalent && usbButtonEquivalent && trsButtonEquivalent;
};
const toSysexArray = (config) => {
  const array = Array.from({ length: 116 }, () => 0);
  const versionArray = config.firmwareVersion.trim().split(".").map((n) => parseInt(n));
  array[0] = config.deviceId;
  array[1] = versionArray[0];
  array[2] = versionArray[1];
  array[3] = versionArray[2];
  array[4] = config.faderBlink ? 1 : 0;
  array[5] = config.accelBlink ? 1 : 0;
  array[6] = config.controllerFlip ? 1 : 0;
  array[7] = config.i2cLeader ? 1 : 0;
  const faderminMSB = config.faderMin >> 7;
  const faderminLSB = config.faderMin - (faderminMSB << 7);
  array[8] = faderminLSB;
  array[9] = faderminMSB;
  const fadermaxMSB = config.faderMax >> 7;
  const fadermaxLSB = config.faderMax - (fadermaxMSB << 7);
  array[10] = fadermaxLSB;
  array[11] = fadermaxMSB;
  array[12] = config.midiThru ? 1 : 0;
  array[13] = config.midiMode ? 1 : 0;
  array[14] = config.dxMode ? 1 : 0;
  array[15] = config.pageNumber;
  const usbChannelOffset = 20;
  const trsChannelOffset = 36;
  const usbControlOffset = 52;
  const trsControlOffset = 68;
  config.usbControls.forEach((control, index) => {
    array[index + usbChannelOffset] = control.channel;
    array[index + usbControlOffset] = control.cc;
  });
  config.trsControls.forEach((control, index) => {
    array[index + trsChannelOffset] = control.channel;
    array[index + trsControlOffset] = control.cc;
  });
  const usbButtonChannelOffset = 84;
  const trsButtonChannelOffset = 88;
  const usbButtonModeOffset = 92;
  const trsButtonModeOffset = 96;
  const usbButtonParamAOffset = 100;
  const trsButtonParamAOffset = 104;
  const usbButtonParamBOffset = 108;
  const trsButtonParamBOffset = 112;
  config.usbButtons.forEach((button, index) => {
    array[index + usbButtonChannelOffset] = button.channel;
    array[index + usbButtonModeOffset] = button.mode;
    array[index + usbButtonParamAOffset] = button.paramA;
    array[index + usbButtonParamBOffset] = button.paramB;
  });
  config.trsButtons.forEach((button, index) => {
    array[index + trsButtonChannelOffset] = button.channel;
    array[index + trsButtonModeOffset] = button.mode;
    array[index + trsButtonParamAOffset] = button.paramA;
    array[index + trsButtonParamBOffset] = button.paramB;
  });
  return array;
};
const toDeviceOptionsSysexArray = (config) => {
  return toSysexArray(config).slice(4, 20);
};
const toUSBOptionsSysexArray = (config) => {
  const fullArray = toSysexArray(config);
  const channels = fullArray.slice(20, 36);
  const ccs = fullArray.slice(52, 68);
  return channels.concat(ccs);
};
const toTRSOptionsSysexArray = (config) => {
  const fullArray = toSysexArray(config);
  const channels = fullArray.slice(36, 52);
  const ccs = fullArray.slice(68, 84);
  return channels.concat(ccs);
};
const configToJsonString = (config) => {
  const o = { ...config };
  const controllerCount = deviceForId(config.deviceId).controlCount;
  const buttonsCount = deviceForId(config.deviceId).buttonCount;
  o.usbControls = o.usbControls.splice(0, controllerCount);
  o.usbControls.forEach((c) => delete c.val);
  o.trsControls = o.trsControls.splice(0, controllerCount);
  o.usbButtons = o.usbButtons.splice(0, buttonsCount);
  o.trsButtons = o.trsButtons.splice(0, buttonsCount);
  return JSON.stringify(o, null, 2);
};
const isConfigForDevice = (config, json) => {
  if (json.deviceId != config.deviceId) {
    return `Cannot update - this data file is for a ${deviceForId(json.deviceId).name}, but you are trying to install it on a ${deviceForId(config.deviceId).name} `;
  }
  return false;
};
const updateFromJson = (config, json) => {
  Object.keys(json).forEach((key) => {
    if (key !== "pageNumber") {
      config[key] = json[key];
    }
  });
  return config;
};
const configFromSysexArray = (data) => {
  const offset = 8;
  const deviceId = data[5];
  const firmwareVersion = data[6] + "." + data[7] + "." + data[8];
  const faderBlink = data[1 + offset] == 1;
  const accelBlink = data[2 + offset] == 1;
  const controllerFlip = data[3 + offset] == 1;
  const i2cLeader = data[4 + offset] == 1;
  const faderminLSB = data[5 + offset];
  const faderminMSB = data[6 + offset];
  const faderMin = (faderminMSB << 7) + faderminLSB;
  const fadermaxLSB = data[7 + offset];
  const fadermaxMSB = data[8 + offset];
  const faderMax = (fadermaxMSB << 7) + fadermaxLSB;
  const midiThru = data[9 + offset] == 1;
  const midiMode = data[10 + offset] == 1;
  const dxMode = data[11 + offset] == 1;
  const pageNumber = data[12 + offset];
  const usbControls = [];
  const trsControls = [];
  const usbButtons = [];
  const trsButtons = [];
  data.slice(17 + offset, 33 + offset).forEach((chan, i) => {
    if (chan != 127) {
      usbControls[i] = {
        channel: chan
      };
    }
  });
  data.slice(33 + offset, 49 + offset).forEach((chan, i) => {
    if (chan != 127) {
      trsControls[i] = {
        channel: chan
      };
    }
  });
  data.slice(49 + offset, 65 + offset).forEach((cc, i) => {
    if (cc != 127) {
      usbControls[i].cc = cc;
    }
  });
  data.slice(65 + offset, 81 + offset).forEach((cc, i) => {
    if (cc != 127) {
      trsControls[i].cc = cc;
    }
  });
  data.slice(81 + offset, 85 + offset).forEach((chan, i) => {
    if (chan != 127) {
      usbButtons[i] = {
        channel: chan
      };
    }
  });
  data.slice(85 + offset, 89 + offset).forEach((chan, i) => {
    if (chan != 127) {
      trsButtons[i] = {
        channel: chan
      };
    }
  });
  data.slice(89 + offset, 93 + offset).forEach((mod, i) => {
    if (mod != 127) {
      usbButtons[i].mode = mod;
    }
  });
  data.slice(93 + offset, 97 + offset).forEach((mod, i) => {
    if (mod != 127) {
      trsButtons[i].mode = mod;
    }
  });
  data.slice(97 + offset, 101 + offset).forEach((par, i) => {
    if (par != 127) {
      usbButtons[i].paramA = par;
    }
  });
  data.slice(101 + offset, 105 + offset).forEach((par, i) => {
    if (par != 127) {
      trsButtons[i].paramA = par;
    }
  });
  data.slice(105 + offset, 109 + offset).forEach((par, i) => {
    if (par != 127) {
      usbButtons[i].paramB = par;
    }
  });
  data.slice(109 + offset, 113 + offset).forEach((par, i) => {
    if (par != 127) {
      trsButtons[i].paramB = par;
    }
  });
  usbControls.forEach((c) => c.val = 0);
  return {
    faderBlink,
    accelBlink,
    controllerFlip,
    midiThru,
    midiMode,
    dxMode,
    usbControls,
    trsControls,
    deviceId,
    firmwareVersion,
    i2cLeader,
    faderMin,
    faderMax,
    usbButtons,
    trsButtons,
    pageNumber
  };
};
const deviceForId = (id) => allKnownDevices[id];
const deviceHasCapability = (config, capability) => {
  const device = deviceForId(config.deviceId);
  return !!device.capabilities[capability];
};
const allKnownDevices = [
  {
    name: "unknown",
    controlCount: 0,
    capabilities: {}
  },
  {
    name: "Oxion development board",
    controlCount: 4,
    capabilities: {
      led: true
    }
  },
  {
    name: "16n",
    controlCount: 16,
    capabilities: {
      i2c: true,
      led: true
    }
  },
  {
    name: "16n (LC)",
    controlCount: 16,
    capabilities: {
      i2c: true,
      led: true
    },
    sendShortMessages: true
  },
  {
    name: "Music Thing 8mu",
    controlCount: 16,
    buttonCount: 4,
    capabilities: {
      i2c: false,
      led: true
    }
  }
];
const SYSEX_CONSTANTS = {
  sysexMfgId: [125, 0, 0],
  requestInfoMsg: 31,
  updateConfigMsg: 14,
  updateDeviceOptionsMsg: 13,
  updateUSBOptionsMessage: 12,
  updateTRSOptionsMessage: 11
};
const isOxionSysex = (data) => {
  return data[1] == SYSEX_CONSTANTS.sysexMfgId[0] && data[2] == SYSEX_CONSTANTS.sysexMfgId[1] && data[3] == SYSEX_CONSTANTS.sysexMfgId[2];
};
const sendConfiguration = (configuration2, output) => {
  if (deviceForId(configuration2.deviceId).sendShortMessages) {
    sendShortConfiguration(configuration2, output);
  } else {
    sendFullConfiguration(configuration2, output);
  }
};
const sendFullConfiguration = (configuration2, output) => {
  output.sendSysex(SYSEX_CONSTANTS.sysexMfgId, [
    SYSEX_CONSTANTS.updateConfigMsg,
    ...toSysexArray(configuration2)
  ]);
};
const sendShortConfiguration = (configuration2, output) => {
  output.sendSysex(SYSEX_CONSTANTS.sysexMfgId, [
    SYSEX_CONSTANTS.updateDeviceOptionsMsg,
    ...toDeviceOptionsSysexArray(configuration2)
  ]);
  output.sendSysex(SYSEX_CONSTANTS.sysexMfgId, [
    SYSEX_CONSTANTS.updateUSBOptionsMessage,
    ...toUSBOptionsSysexArray(configuration2)
  ]);
  output.sendSysex(SYSEX_CONSTANTS.sysexMfgId, [
    SYSEX_CONSTANTS.updateTRSOptionsMessage,
    ...toTRSOptionsSysexArray(configuration2)
  ]);
};
const requestConfig = (output) => {
  output.sendSysex(SYSEX_CONSTANTS.sysexMfgId, [
    SYSEX_CONSTANTS.requestInfoMsg
  ]);
};
const configuration = writable(null);
const editConfiguration = writable(
  null
);
const editMode = writable(false);
const midiInputs = writable([]);
const selectedMidiInput = writable(null);
const selectedMidiOutput = writable(null);
const webMidiEnabled = writable(false);
selectedMidiInput.subscribe((newInput) => {
  if (newInput) {
    get_store_value(midiInputs).forEach((input) => {
      input.removeListener();
    });
    listenForCC(newInput);
    listenForSysex(newInput);
    configuration.set(null);
    doRequestConfig();
  }
});
selectedMidiOutput.subscribe((newOutput) => {
  if (newOutput) {
    configuration.set(null);
    doRequestConfig();
  }
});
const controllerMoved = (event) => {
  const config = get_store_value(configuration);
  if (config) {
    config.usbControls.forEach((c) => {
      if (c.channel == event.message.channel && c.cc == event.controller.number) {
        c.val = event.rawValue;
      }
    });
    configuration.set(config);
  }
};
const listenForCC = (input) => {
  input.addListener("controlchange", controllerMoved);
};
const listenForSysex = (input) => {
  input.addListener("sysex", (e) => {
    const data = e.message.data;
    if (!isOxionSysex(data)) {
      return;
    }
    if (data[4] == 15) {
      configuration.set(configFromSysexArray(data));
      logger("Received config", get_store_value(configuration));
    }
  });
  logger("Attached sysex listener to ", input.name);
};
const doRequestConfig = () => {
  const selectedInput = get_store_value(selectedMidiInput);
  const selectedOutput = get_store_value(selectedMidiOutput);
  if (selectedInput && selectedOutput) {
    logger("Requesting config over " + selectedOutput.name);
    logger("Hoping to receive on " + selectedInput.name);
    requestConfig(selectedOutput);
  }
};
const DeviceDetails_svelte_svelte_type_style_lang = "";
const css$d = {
  code: ".details.svelte-1n5oywy{flex:1 0}p.device.svelte-1n5oywy{text-align:right}span.upgrade.svelte-1n5oywy{display:block;margin-top:25px;border:10px solid pink;border-image:repeating-linear-gradient(\n  -55deg,\n  #000,\n  #000 5px,\n  #ffb101 5px,\n  #ffb101 10px  ) 10;text-align:center;padding:5px;background:#ffcc33}",
  map: null
};
const DeviceDetails = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $webMidiEnabled, $$unsubscribe_webMidiEnabled;
  let $configuration, $$unsubscribe_configuration;
  $$unsubscribe_webMidiEnabled = subscribe(webMidiEnabled, (value) => $webMidiEnabled = value);
  $$unsubscribe_configuration = subscribe(configuration, (value) => $configuration = value);
  let upgradeString = "";
  let latestVersion = "1.0.2";
  let versionCompared = false;
  const unsub = configuration.subscribe((c) => {
    if (c && c.firmwareVersion && latestVersion.trim() !== "" && !versionCompared) {
      versionCompared = true;
      if (gt(latestVersion, c.firmwareVersion)) {
        upgradeString = `A new version of the 8mu firmware (${latestVersion}) is available.`;
      } else {
        upgradeString = "";
      }
    }
  });
  onDestroy(() => {
    unsub();
  });
  $$result.css.add(css$d);
  $$unsubscribe_webMidiEnabled();
  $$unsubscribe_configuration();
  return `${$webMidiEnabled ? `<div class="details svelte-1n5oywy">
    ${$configuration ? `<p class="device svelte-1n5oywy">Connected: <strong>${escape(deviceForId($configuration.deviceId).name)}</strong>
        running firmware
        <strong>${escape($configuration.firmwareVersion)}</strong>
        ${upgradeString.trim() != "" ? `<span class="upgrade svelte-1n5oywy">${escape(upgradeString)}
            <a href="https://github.com/TomWhitwell/Smith-Kakehashi/releases">Download</a></span>` : ``}</p>` : `<p class="device svelte-1n5oywy">No device connected.</p>`}</div>` : ``}`;
});
const Icon_svelte_svelte_type_style_lang = "";
const css$c = {
  code: "span.fas.mid.svelte-pvbvkq{color:#888}span.fas.light.svelte-pvbvkq{color:#ccc}",
  map: null
};
const Icon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { i } = $$props;
  let { classList = "" } = $$props;
  if ($$props.i === void 0 && $$bindings.i && i !== void 0)
    $$bindings.i(i);
  if ($$props.classList === void 0 && $$bindings.classList && classList !== void 0)
    $$bindings.classList(classList);
  $$result.css.add(css$c);
  return `<span class="${"fas fa-" + escape(i, true) + " " + escape(classList, true) + " svelte-pvbvkq"}"></span>`;
});
const Button_svelte_svelte_type_style_lang = "";
const css$b = {
  code: "div.svelte-1qu28ag{margin:0;display:inline-block}button.svelte-1qu28ag{text-align:left;border-radius:5px;display:inline-block;cursor:pointer}button.svelte-1qu28ag:disabled{cursor:not-allowed}",
  map: null
};
const Button = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { label } = $$props;
  let { icon = "" } = $$props;
  let { disabled = false } = $$props;
  let { click } = $$props;
  if ($$props.label === void 0 && $$bindings.label && label !== void 0)
    $$bindings.label(label);
  if ($$props.icon === void 0 && $$bindings.icon && icon !== void 0)
    $$bindings.icon(icon);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  if ($$props.click === void 0 && $$bindings.click && click !== void 0)
    $$bindings.click(click);
  $$result.css.add(css$b);
  return `<div class="button-wrapper svelte-1qu28ag"><button ${disabled ? "disabled" : ""} class="svelte-1qu28ag">${icon && icon.trim() !== "" ? `${validate_component(Icon, "Icon").$$render($$result, { i: icon }, {}, {})}` : ``}
    ${escape(label)}</button>
</div>`;
});
const CheckOption = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { checked } = $$props;
  if ($$props.checked === void 0 && $$bindings.checked && checked !== void 0)
    $$bindings.checked(checked);
  return `<p><label><input type="checkbox"${add_attribute("checked", checked, 1)}>
    ${slots.default ? slots.default({}) : ``}</label></p>`;
});
const DeviceOptions_svelte_svelte_type_style_lang = "";
const css$a = {
  code: "p.note.svelte-idpdcv{width:600px;line-height:1.2}p.note.small.svelte-idpdcv{font-size:85%}label.svelte-idpdcv{font-weight:bold}",
  map: null
};
const DeviceOptions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $editConfiguration, $$unsubscribe_editConfiguration;
  let $configuration, $$unsubscribe_configuration;
  $$unsubscribe_editConfiguration = subscribe(editConfiguration, (value) => $editConfiguration = value);
  $$unsubscribe_configuration = subscribe(configuration, (value) => $configuration = value);
  $$result.css.add(css$a);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `${$configuration && $editConfiguration ? `${deviceHasCapability($configuration, "led") ? `${validate_component(CheckOption, "CheckOption").$$render(
      $$result,
      { checked: $editConfiguration.faderBlink },
      {
        checked: ($$value) => {
          $editConfiguration.faderBlink = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `Blink LEDs on fader movements
    `;
        }
      }
    )}

    ${validate_component(CheckOption, "CheckOption").$$render(
      $$result,
      { checked: $editConfiguration.accelBlink },
      {
        checked: ($$value) => {
          $editConfiguration.accelBlink = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `Blink LEDs on accelerometer movements
    `;
        }
      }
    )}` : ``}

  ${validate_component(CheckOption, "CheckOption").$$render(
      $$result,
      {
        checked: $editConfiguration.controllerFlip
      },
      {
        checked: ($$value) => {
          $editConfiguration.controllerFlip = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `Rotate controller 180º
  `;
        }
      }
    )}

  ${validate_component(CheckOption, "CheckOption").$$render(
      $$result,
      { checked: $editConfiguration.midiThru },
      {
        checked: ($$value) => {
          $editConfiguration.midiThru = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `Soft MIDI thru (echo MIDI clock/note data sent to USB out of the minijack)
  `;
        }
      }
    )}

  ${validate_component(CheckOption, "CheckOption").$$render(
      $$result,
      { checked: $editConfiguration.midiMode },
      {
        checked: ($$value) => {
          $editConfiguration.midiMode = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${$editConfiguration.midiMode ? `Midi Type B (Arturia)` : `${!$editConfiguration.midiMode ? `Midi Type A (Make Noise, Intellijel)` : ``}`}`;
        }
      }
    )}

  

  <hr>

  <h3>Fader calibration</h3>

  ${$configuration.pageNumber > 0 ? `<b>NB: Fader Calibration is global, and can only be changed in Bank 1</b>` : `<div><label for="faderMin" class="svelte-idpdcv">Fader Minimum raw value</label>
      <input name="faderMin" type="number" min="0"${add_attribute("max", (1 << 13) - 1, 0)}${add_attribute("value", $editConfiguration.faderMin, 0)}></div>
    <div><label for="faderMax" class="svelte-idpdcv">Fader Maximum raw value</label>
      <input name="faderMax" type="number" min="0"${add_attribute("max", (1 << 13) - 1, 0)}${add_attribute("value", $editConfiguration.faderMax, 0)}></div>

    <p class="note svelte-idpdcv">Every fader is slightly different - depending on conditions when it was
      manufactured. You shouldn&#39;t touch this unless you are having issues with
      your faders either reaching <code>127</code> before the end of their
      travel, or not at all. <br><br>
      NB: these instructions are quite counter-intuitive, so read this carefully!<br>

      • &quot;Raw&quot; analog values are read from the faders between 0 and 4096.
      <br>
      • For Reasons, the Fader Maximum value relates to the BOTTOM of the fader
      range (assuming the USB cable is on the right so the controller is not in &#39;flipped&#39;
      mode). The Fader Minimum relates to the TOP of the range.<br>
      • If when you pull the fader down, it sticks at 1 or 2 or more, so doesn&#39;t
      get all the way to 0, you should reduce the Fader Maximum value, maybe to 4080.<br>
      • If when you push the fader up, it stick at 126, 125 or less, so doesn&#39;t
      get all the way to 127, you should increase the Fader Minimum value, maybe
      to 100.<br>
      • Defaults are Min = 15, Max = 4080.
    </p>`}

  ${deviceHasCapability($configuration, "i2c") ? `<hr>
    <h3>I2C Leader/Follower</h3>
    <select><option${add_attribute("value", false, 0)}>Follower</option><option${add_attribute("value", true, 0)}>Leader</option></select>

    <p class="note svelte-idpdcv"><strong>Follower</strong> mode is for use with Teletype.</p>
    <p class="note svelte-idpdcv"><strong>Leader</strong> mode is for use with Ansible, TXo, ER-301. 8mu will
      not respond to Teletype when in leader mode.
    </p>
    <p class="note svelte-idpdcv">This will not take effect until you restart (disconnect/reconnect) your
      8mu.
    </p>
    <p class="note small svelte-idpdcv">(&quot;Leader&quot; is sometimes also referred to as &#39;master&#39; mode)
    </p>` : ``}` : ``}`;
  } while (!$$settled);
  $$unsubscribe_editConfiguration();
  $$unsubscribe_configuration();
  return $$rendered;
});
const inputNames = [
  "Fader 1",
  "Fader 2",
  "Fader 3",
  "Fader 4",
  "Fader 5",
  "Fader 6",
  "Fader 7",
  "Fader 8",
  " ↑ Front",
  "↑ Back",
  "↑ Right",
  "↑ Left",
  "↻",
  "↺",
  "ʎɐʍ sᴉɥʇ",
  "this way"
];
const channelColours = [
  125,
  125,
  125,
  125,
  125,
  125,
  125,
  125,
  155,
  155,
  155,
  155,
  155,
  155,
  155,
  155
];
const chans = Array.from(Array(10).keys()).map((n) => `${n + 1}`);
const channelNames = ["OFF", ...chans];
const CHROMATIC = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B"
];
const buttonModeNames = ["CC", "Keyboard"];
const buttonNames = ["A", "B", "C", "D"];
const EditControl_svelte_svelte_type_style_lang = "";
const css$9 = {
  code: "dl.svelte-gqdu21.svelte-gqdu21{flex:1;text-align:center}dt.svelte-gqdu21.svelte-gqdu21{font-weight:bold;border-top:1px solid #aaa;padding-top:0.5rem;margin-right:5px}dt.index.svelte-gqdu21.svelte-gqdu21{background:#666;color:#f0f0f0;padding:0.5rem 0}dd.svelte-gqdu21.svelte-gqdu21{padding:0 0 0.5rem 0;border-bottom:1px solid #aaa;margin:0;margin-right:5px}dd.svelte-gqdu21 input.svelte-gqdu21:invalid{background:#f99}",
  map: null
};
const EditControl = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_editConfiguration;
  $$unsubscribe_editConfiguration = subscribe(editConfiguration, (value) => value);
  let { index } = $$props;
  let { editControl } = $$props;
  const possibleChannels = Array.from(Array(17).keys());
  possibleChannels.forEach((c, i) => possibleChannels[i] = c);
  if ($$props.index === void 0 && $$bindings.index && index !== void 0)
    $$bindings.index(index);
  if ($$props.editControl === void 0 && $$bindings.editControl && editControl !== void 0)
    $$bindings.editControl(editControl);
  $$result.css.add(css$9);
  $$unsubscribe_editConfiguration();
  return `<dl class="config-column svelte-gqdu21"><dt class="index svelte-gqdu21" style="${"background-color: rgb(" + escape(channelColours[index], true) + ",125,125)"}">${escape(inputNames[index])}
  </dt><dt class="svelte-gqdu21">Channel</dt><dd class="svelte-gqdu21"><select>${each(possibleChannels, (channel) => {
    return `<option${add_attribute("value", channel, 0)}>${escape(channelNames[channel])}</option>`;
  })}</select>
  </dd><dt class="svelte-gqdu21">CC</dt><dd class="svelte-gqdu21"><input type="number" min="0" max="127" class="svelte-gqdu21"${add_attribute("value", editControl.cc, 0)}></dd></dl>`;
});
const EditControlButton_svelte_svelte_type_style_lang = "";
const css$8 = {
  code: "dl.svelte-6nh3sy{flex:1;text-align:center}dt.svelte-6nh3sy{font-weight:bold;border-top:1px solid #aaa;padding-top:0.5rem;margin-right:5px}dt.index.svelte-6nh3sy{background:#666;color:#f0f0f0;padding:0.5rem 0}dd.svelte-6nh3sy{padding:0 0 0.5rem 0;border-bottom:1px solid #aaa;margin:0;margin-right:5px}",
  map: null
};
const EditControlButton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_editConfiguration;
  $$unsubscribe_editConfiguration = subscribe(editConfiguration, (value) => value);
  let { index } = $$props;
  let { editButton } = $$props;
  const possibleChannels = Array.from(Array(16).keys());
  possibleChannels.forEach((c, i) => possibleChannels[i] = c + 1);
  const possibleCCs = Array.from(Array(128).keys());
  function fromMidi(midi) {
    const name = CHROMATIC[midi % 12];
    const oct = Math.floor(midi / 12) - 1;
    return `${name}${oct}`;
  }
  if ($$props.index === void 0 && $$bindings.index && index !== void 0)
    $$bindings.index(index);
  if ($$props.editButton === void 0 && $$bindings.editButton && editButton !== void 0)
    $$bindings.editButton(editButton);
  $$result.css.add(css$8);
  $$unsubscribe_editConfiguration();
  return `<dl class="config-column svelte-6nh3sy"><dt class="index svelte-6nh3sy">Button ${escape(buttonNames[index])}</dt><dt class="svelte-6nh3sy">Channel</dt><dd class="svelte-6nh3sy"><select>${each(possibleChannels, (channel) => {
    return `<option${add_attribute("value", channel, 0)}>${escape(channel)}</option>`;
  })}</select>
  </dd><dt class="svelte-6nh3sy">Mode</dt><dd class="svelte-6nh3sy"><select>${each(buttonModeNames, (mode, index2) => {
    return `<option${add_attribute("value", index2, 0)}>${escape(mode)}</option>`;
  })}</select>
  </dd>${editButton.mode == 1 ? `<dt class="svelte-6nh3sy">Note number</dt>
    <dd class="svelte-6nh3sy"><select>${each(possibleCCs, (CC) => {
    return `<option${add_attribute("value", CC, 0)}>${escape(CC)}</option>`;
  })}</select>
      (${escape(fromMidi(editButton.paramA))})
    </dd>

    <dt class="svelte-6nh3sy">Velocity</dt>
    <dd class="svelte-6nh3sy"><select>${each(possibleCCs, (CC) => {
    return `<option${add_attribute("value", CC, 0)}>${escape(CC)}</option>`;
  })}</select></dd>` : `<dt class="svelte-6nh3sy">Controller</dt>
    <dd class="svelte-6nh3sy"><select>${each(possibleCCs, (CC) => {
    return `<option${add_attribute("value", CC, 0)}>${escape(CC)}</option>`;
  })}</select></dd>

    <dt class="svelte-6nh3sy">On value</dt>
    <dd class="svelte-6nh3sy"><select>${each(possibleCCs, (CC) => {
    return `<option${add_attribute("value", CC, 0)}>${escape(CC)}</option>`;
  })}</select></dd>`}</dl>`;
});
const Subhead_svelte_svelte_type_style_lang = "";
const css$7 = {
  code: ".subhead.svelte-1o2kpty.svelte-1o2kpty{display:flex}.subhead.svelte-1o2kpty h2.svelte-1o2kpty{flex:3;margin:0}.subhead.svelte-1o2kpty p{margin:0}.subhead.svelte-1o2kpty .details.svelte-1o2kpty{flex:2;text-align:right}",
  map: null
};
const Subhead = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  $$result.css.add(css$7);
  return `<div class="subhead svelte-1o2kpty"><h2 class="svelte-1o2kpty">${escape(title)}</h2>
  <div class="details svelte-1o2kpty">${slots.default ? slots.default({}) : ``}</div>
</div>`;
});
const TABS = {};
const Tabs = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const tabs = [];
  const panels = [];
  const selectedTab = writable(null);
  const selectedPanel = writable(null);
  setContext(TABS, {
    registerTab: (tab) => {
      tabs.push(tab);
      selectedTab.update((current) => current || tab);
      onDestroy(() => {
        const i = tabs.indexOf(tab);
        tabs.splice(i, 1);
        selectedTab.update((current) => current === tab ? tabs[i] || tabs[tabs.length - 1] : current);
      });
    },
    registerPanel: (panel) => {
      panels.push(panel);
      selectedPanel.update((current) => current || panel);
      onDestroy(() => {
        const i = panels.indexOf(panel);
        panels.splice(i, 1);
        selectedPanel.update((current) => current === panel ? panels[i] || panels[panels.length - 1] : current);
      });
    },
    selectTab: (tab) => {
      const i = tabs.indexOf(tab);
      selectedTab.set(tab);
      selectedPanel.set(panels[i]);
    },
    selectedTab,
    selectedPanel
  });
  return `<div class="tabs">${slots.default ? slots.default({}) : ``}</div>`;
});
const TabList_svelte_svelte_type_style_lang = "";
const css$6 = {
  code: ".tab-list.svelte-1c799zm{border-bottom:1px solid #888;margin-bottom:1rem;height:32px}",
  map: null
};
const TabList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$6);
  return `<div class="tab-list svelte-1c799zm">${slots.default ? slots.default({}) : ``}
</div>`;
});
const TabPanel = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $selectedPanel, $$unsubscribe_selectedPanel;
  const panel = {};
  const { registerPanel, selectedPanel } = getContext(TABS);
  $$unsubscribe_selectedPanel = subscribe(selectedPanel, (value) => $selectedPanel = value);
  registerPanel(panel);
  $$unsubscribe_selectedPanel();
  return `${$selectedPanel === panel ? `${slots.default ? slots.default({}) : ``}` : ``}`;
});
const Tab_svelte_svelte_type_style_lang = "";
const css$5 = {
  code: "button.svelte-1rryekj{background:none;border:none;border-bottom:1px solid #888;border-radius:0;margin:0;color:#aaa;padding-left:6px;padding-right:6px}.selected.svelte-1rryekj{border-top:1px solid #888;border-right:1px solid #888;border-left:1px solid #888;border-bottom:1px solid #f0f0f0;border-radius:2px;color:#333;padding-left:5px;padding-right:5px}button.svelte-1rryekj:hover{cursor:pointer;border-top:1px solid #888;border-right:1px solid #888;border-left:1px solid #888}",
  map: null
};
const Tab = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $selectedTab, $$unsubscribe_selectedTab;
  const tab = {};
  const { registerTab, selectTab, selectedTab } = getContext(TABS);
  $$unsubscribe_selectedTab = subscribe(selectedTab, (value) => $selectedTab = value);
  registerTab(tab);
  $$result.css.add(css$5);
  $$unsubscribe_selectedTab();
  return `<button class="${["svelte-1rryekj", $selectedTab === tab ? "selected" : ""].join(" ").trim()}">${slots.default ? slots.default({}) : ``}
</button>`;
});
const importConfig = (currentEditConfig, currentConfig) => {
  const fileInputNode = document.createElement("input");
  fileInputNode.type = "file";
  fileInputNode.id = "uploadedConfig";
  fileInputNode.addEventListener("change", (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newConfig = files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const newConfigData = JSON.parse(reader.result);
        const invalidConfig = isConfigForDevice(
          currentEditConfig,
          newConfigData
        );
        if (invalidConfig) {
          alert(invalidConfig);
          return;
        } else {
          editConfiguration.update(
            () => updateFromJson(currentEditConfig, newConfigData)
          );
          if (isEquivalent(currentEditConfig, currentConfig)) {
            alert(
              "Imported configuration is identical to currently loaded configuration; no changes to upload."
            );
          } else {
            alert(
              "New configuration imported. Choose 'update controller' to import, or 'Cancel' to abort"
            );
          }
        }
      });
      reader.readAsText(newConfig);
    }
  });
  fileInputNode.click();
  fileInputNode.remove();
};
const exportConfig = (configObject) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(configToJsonString(configObject));
  const deviceName = deviceForId(configObject.deviceId).name;
  const sanitizedDeviceName = deviceName.trim().toLowerCase().replaceAll(" ", "_");
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.href = dataStr;
  downloadAnchorNode.download = `${sanitizedDeviceName}_controller_config.json`;
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
const Editing_svelte_svelte_type_style_lang = "";
const css$4 = {
  code: "#controls.svelte-13ul1lp{display:flex;min-width:calc(16 * 60px)}",
  map: null
};
const Editing = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let device;
  let $configuration, $$unsubscribe_configuration;
  let $editMode, $$unsubscribe_editMode;
  let $editConfiguration, $$unsubscribe_editConfiguration;
  let $selectedMidiOutput, $$unsubscribe_selectedMidiOutput;
  $$unsubscribe_configuration = subscribe(configuration, (value) => $configuration = value);
  $$unsubscribe_editMode = subscribe(editMode, (value) => $editMode = value);
  $$unsubscribe_editConfiguration = subscribe(editConfiguration, (value) => $editConfiguration = value);
  $$unsubscribe_selectedMidiOutput = subscribe(selectedMidiOutput, (value) => $selectedMidiOutput = value);
  let configDirty = false;
  editConfiguration.subscribe((c) => {
    if (c && $configuration) {
      configDirty = !isEquivalent(c, $configuration);
    }
  });
  const cancelEditMode = () => {
    set_store_value(editMode, $editMode = false, $editMode);
  };
  const doImportConfig = () => {
    if ($editConfiguration && $configuration) {
      importConfig($editConfiguration, $configuration);
    }
  };
  const transmitConfig = () => {
    toSysexArray($editConfiguration);
    sendConfiguration($editConfiguration, $selectedMidiOutput);
    set_store_value(configuration, $configuration = $editConfiguration, $configuration);
    set_store_value(editMode, $editMode = false, $editMode);
  };
  $$result.css.add(css$4);
  device = $configuration ? deviceForId($configuration.deviceId) : null;
  $$unsubscribe_configuration();
  $$unsubscribe_editMode();
  $$unsubscribe_editConfiguration();
  $$unsubscribe_selectedMidiOutput();
  return `${$editConfiguration && $configuration ? `${validate_component(Subhead, "Subhead").$$render(
    $$result,
    {
      title: "Bank " + ($configuration.pageNumber + 1) + ": Edit configuration"
    },
    {},
    {
      default: () => {
        return `${validate_component(Button, "Button").$$render(
          $$result,
          {
            label: "Cancel",
            icon: "times",
            click: cancelEditMode
          },
          {},
          {}
        )}
    ${validate_component(Button, "Button").$$render(
          $$result,
          {
            label: "Import config",
            icon: "file-import",
            click: doImportConfig
          },
          {},
          {}
        )}
    ${validate_component(Button, "Button").$$render(
          $$result,
          {
            label: "Update controller",
            icon: "download",
            click: transmitConfig,
            disabled: !configDirty
          },
          {},
          {}
        )}`;
      }
    }
  )}

  ${validate_component(Tabs, "Tabs").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(TabList, "TabList").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Tab, "Tab").$$render($$result, {}, {}, {
            default: () => {
              return `USB`;
            }
          })}
      ${validate_component(Tab, "Tab").$$render($$result, {}, {}, {
            default: () => {
              return `TRS Midi`;
            }
          })}
      ${validate_component(Tab, "Tab").$$render($$result, {}, {}, {
            default: () => {
              return `USB Buttons`;
            }
          })}
      ${validate_component(Tab, "Tab").$$render($$result, {}, {}, {
            default: () => {
              return `TRS Buttons`;
            }
          })}
      ${validate_component(Tab, "Tab").$$render($$result, {}, {}, {
            default: () => {
              return `Device Options`;
            }
          })}`;
        }
      })}

    ${validate_component(TabPanel, "TabPanel").$$render($$result, {}, {}, {
        default: () => {
          return `<div id="controls" class="svelte-13ul1lp">${each($editConfiguration.usbControls, (editControl, index) => {
            return `${device && index < device.controlCount ? `${validate_component(EditControl, "EditControl").$$render($$result, { editControl, index }, {}, {})}` : ``}`;
          })}</div>`;
        }
      })}

    ${validate_component(TabPanel, "TabPanel").$$render($$result, {}, {}, {
        default: () => {
          return `<div id="controls" class="svelte-13ul1lp">${each($editConfiguration.trsControls, (editControl, index) => {
            return `${device && index < device.controlCount ? `${validate_component(EditControl, "EditControl").$$render($$result, { editControl, index }, {}, {})}` : ``}`;
          })}</div>`;
        }
      })}

    ${validate_component(TabPanel, "TabPanel").$$render($$result, {}, {}, {
        default: () => {
          return `${device?.buttonCount ? `<div id="controls" class="svelte-13ul1lp">${each($editConfiguration.usbButtons, (button, index) => {
            return `${index < device.buttonCount ? `${validate_component(EditControlButton, "EditControlButton").$$render($$result, { editButton: button, index }, {}, {})}` : ``}`;
          })}</div>` : ``}`;
        }
      })}

    ${validate_component(TabPanel, "TabPanel").$$render($$result, {}, {}, {
        default: () => {
          return `${device?.buttonCount ? `<div id="controls" class="svelte-13ul1lp">${each($editConfiguration.trsButtons, (button, index) => {
            return `${index < device.buttonCount ? `${validate_component(EditControlButton, "EditControlButton").$$render($$result, { editButton: button, index }, {}, {})}` : ``}`;
          })}</div>` : ``}`;
        }
      })}

    ${validate_component(TabPanel, "TabPanel").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(DeviceOptions, "DeviceOptions").$$render($$result, {}, {}, {})}`;
        }
      })}`;
    }
  })}` : ``}`;
});
const Control_svelte_svelte_type_style_lang = "";
const css$3 = {
  code: "dl.svelte-5fijw0{flex:1;text-align:center}dt.svelte-5fijw0{font-weight:bold;border-top:1px solid #aaa;padding-top:0.5rem;margin-right:5px}dt.index.svelte-5fijw0{background:#666;color:#f0f0f0;padding:0.5rem 0}dd.svelte-5fijw0{padding:0 0 0.5rem 0;border-bottom:1px solid #aaa;margin:0;margin-right:5px}dd.display.svelte-5fijw0{height:150px;position:relative;padding:0 0 0.5rem 0}.bar.svelte-5fijw0{background:black;display:block;width:35px;margin:0 auto}.inner.svelte-5fijw0{bottom:0.5rem;position:absolute;width:100%}span.svelte-5fijw0{display:block;position:absolute;color:white;padding:0;top:6px;left:0;width:100%}span.lowvalue.svelte-5fijw0{top:-20px;color:black}",
  map: null
};
const Control = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let channelName;
  let { control } = $$props;
  let { index } = $$props;
  let { disableValue = false } = $$props;
  if ($$props.control === void 0 && $$bindings.control && control !== void 0)
    $$bindings.control(control);
  if ($$props.index === void 0 && $$bindings.index && index !== void 0)
    $$bindings.index(index);
  if ($$props.disableValue === void 0 && $$bindings.disableValue && disableValue !== void 0)
    $$bindings.disableValue(disableValue);
  $$result.css.add(css$3);
  channelName = control.channel == 0 ? "OFF" : `${control.channel}`;
  return `<dl class="config-column svelte-5fijw0"><dt class="index svelte-5fijw0" style="${"background-color: rgb(" + escape(channelColours[index], true) + ",125,125)"}">${escape(inputNames[index])}
  </dt><dt class="svelte-5fijw0">Channel</dt><dd class="svelte-5fijw0">${escape(channelName)}</dd><dt class="svelte-5fijw0">CC</dt><dd class="svelte-5fijw0">${escape(control.cc)}</dd>${!disableValue ? `<dt class="svelte-5fijw0">Value</dt>
    <dd class="display svelte-5fijw0"><div class="inner svelte-5fijw0">${control.val !== void 0 ? `<span class="${escape(null_to_empty(control.val < 27 ? "lowvalue" : ""), true) + " svelte-5fijw0"}">${escape(control.val)}</span>` : ``}
        <div class="bar svelte-5fijw0" style="${"height: " + escape(control.val, true) + "px; background-color: rgb(" + escape(channelColours[index], true) + ",125,125)"}"></div></div></dd>` : ``}</dl>`;
});
const tips = [
  "Set a channel to 0 to disable it",
  "Read the instructions on the back!",
  "Click Edit Config for device options",
  "Ignore those eject warnings",
  "The boot folder is called MTM_BOOT"
];
const randomTip = () => tips[Math.floor(Math.random() * tips.length)];
const Readout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $configuration, $$unsubscribe_configuration;
  $$unsubscribe_configuration = subscribe(configuration, (value) => $configuration = value);
  $$unsubscribe_configuration();
  return `${$configuration ? `<p>Fader blink
    ${$configuration.faderBlink ? `on` : `${!$configuration.faderBlink ? `off` : ``}`}
    | Gesture blink
    ${$configuration.accelBlink ? `on` : `${!$configuration.accelBlink ? `off` : ``}`}
    | Usb on
    ${$configuration.controllerFlip ? `left` : `${!$configuration.controllerFlip ? `right` : ``}`}
    | Midi thru
    ${$configuration.midiThru ? `on` : `${!$configuration.midiThru ? `off` : ``}`}
    |

    ${$configuration.midiMode ? `Midi Type B` : `${!$configuration.midiMode ? `Midi Type A` : ``}`}
    |

    

    Tip: ${escape(randomTip())}</p>` : ``}`;
});
const ControlButton_svelte_svelte_type_style_lang = "";
const css$2 = {
  code: "dl.svelte-5fijw0{flex:1;text-align:center}dt.svelte-5fijw0{font-weight:bold;border-top:1px solid #aaa;padding-top:0.5rem;margin-right:5px}dt.index.svelte-5fijw0{background:#666;color:#f0f0f0;padding:0.5rem 0}dd.svelte-5fijw0{padding:0 0 0.5rem 0;border-bottom:1px solid #aaa;margin:0;margin-right:5px}",
  map: null
};
const ControlButton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let modeName;
  let buttonName;
  let { button } = $$props;
  let { index } = $$props;
  function fromMidi(midi) {
    const name = CHROMATIC[midi % 12];
    const oct = Math.floor(midi / 12) - 1;
    return `${name}${oct}`;
  }
  if ($$props.button === void 0 && $$bindings.button && button !== void 0)
    $$bindings.button(button);
  if ($$props.index === void 0 && $$bindings.index && index !== void 0)
    $$bindings.index(index);
  $$result.css.add(css$2);
  modeName = buttonModeNames[button.mode];
  buttonName = buttonNames[index];
  return `<dl class="config-column svelte-5fijw0"><dt class="index svelte-5fijw0">${escape(buttonName)}</dt><dt class="svelte-5fijw0">Channel</dt><dd class="svelte-5fijw0">${escape(button.channel)}</dd><dt class="svelte-5fijw0">Mode</dt><dd class="svelte-5fijw0">${escape(modeName)}</dd>${button.mode == 1 ? `<dt class="svelte-5fijw0">Note Number</dt>
    <dd class="svelte-5fijw0">${escape(button.paramA)} (${escape(fromMidi(button.paramA))})</dd>
    <dt class="svelte-5fijw0">Velocity</dt>
    <dd class="svelte-5fijw0">${escape(button.paramB)}</dd>` : `<dt class="svelte-5fijw0">CC</dt>
    <dd class="svelte-5fijw0">${escape(button.paramA)}</dd>
    <dt class="svelte-5fijw0">On Value</dt>
    <dd class="svelte-5fijw0">${escape(button.paramB)}</dd>`}</dl>`;
});
const Viewing_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: "#controls.svelte-13ul1lp{display:flex;min-width:calc(16 * 60px)}",
  map: null
};
const Viewing = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let device;
  let currentBank;
  let $configuration, $$unsubscribe_configuration;
  let $editConfiguration, $$unsubscribe_editConfiguration;
  let $editMode, $$unsubscribe_editMode;
  $$unsubscribe_configuration = subscribe(configuration, (value) => $configuration = value);
  $$unsubscribe_editConfiguration = subscribe(editConfiguration, (value) => $editConfiguration = value);
  $$unsubscribe_editMode = subscribe(editMode, (value) => $editMode = value);
  const doExportConfig = () => {
    if ($configuration) {
      exportConfig($configuration);
    }
  };
  const doEditMode = () => {
    set_store_value(editMode, $editMode = true, $editMode);
    if ($configuration) {
      set_store_value(editConfiguration, $editConfiguration = structuredClone($configuration), $editConfiguration);
    }
  };
  $$result.css.add(css$1);
  device = $configuration ? deviceForId($configuration.deviceId) : null;
  currentBank = $configuration ? $configuration.pageNumber + 1 : "?";
  $$unsubscribe_configuration();
  $$unsubscribe_editConfiguration();
  $$unsubscribe_editMode();
  return `${validate_component(Subhead, "Subhead").$$render(
    $$result,
    {
      title: "Bank " + currentBank + ": Current Configuration"
    },
    {},
    {
      default: () => {
        return `${validate_component(Button, "Button").$$render(
          $$result,
          {
            label: "Export current config",
            icon: "file-export",
            click: doExportConfig
          },
          {},
          {}
        )}
  ${validate_component(Button, "Button").$$render(
          $$result,
          {
            label: "Edit Config",
            icon: "pencil-alt",
            click: doEditMode
          },
          {},
          {}
        )}
  `;
      }
    }
  )}
${validate_component(Tabs, "Tabs").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(TabList, "TabList").$$render($$result, {}, {}, {
        default: () => {
          return `${validate_component(Tab, "Tab").$$render($$result, {}, {}, {
            default: () => {
              return `USB`;
            }
          })}
    ${validate_component(Tab, "Tab").$$render($$result, {}, {}, {
            default: () => {
              return `TRS Jack`;
            }
          })}
    ${validate_component(Tab, "Tab").$$render($$result, {}, {}, {
            default: () => {
              return `USB Buttons`;
            }
          })}
    ${validate_component(Tab, "Tab").$$render($$result, {}, {}, {
            default: () => {
              return `TRS Buttons`;
            }
          })}`;
        }
      })}

  ${validate_component(TabPanel, "TabPanel").$$render($$result, {}, {}, {
        default: () => {
          return `${$configuration && $configuration.usbControls ? `<div id="controls" class="svelte-13ul1lp">${each($configuration.usbControls, (control, index) => {
            return `${device && index < device.controlCount ? `${validate_component(Control, "Control").$$render($$result, { control, index }, {}, {})}` : ``}`;
          })}</div>` : ``}`;
        }
      })}

  ${validate_component(TabPanel, "TabPanel").$$render($$result, {}, {}, {
        default: () => {
          return `${$configuration && $configuration.trsControls ? `<div id="controls" class="svelte-13ul1lp">${each($configuration.trsControls, (control, index) => {
            return `${device && index < device.controlCount ? `${validate_component(Control, "Control").$$render($$result, { control, index, disableValue: true }, {}, {})}` : ``}`;
          })}</div>
      <p>There is no realtime preview of the TRS outputs.</p>` : ``}`;
        }
      })}

  ${validate_component(TabPanel, "TabPanel").$$render($$result, {}, {}, {
        default: () => {
          return `${$configuration && device?.buttonCount && $configuration.usbButtons ? `<div id="controls" class="svelte-13ul1lp">${each($configuration.usbButtons, (button, index) => {
            return `${device && index < device.buttonCount ? `${validate_component(ControlButton, "ControlButton").$$render($$result, { button, index }, {}, {})}` : ``}`;
          })}</div>` : ``}`;
        }
      })}

  ${validate_component(TabPanel, "TabPanel").$$render($$result, {}, {}, {
        default: () => {
          return `${$configuration && device?.buttonCount && $configuration.trsButtons ? `<div id="controls" class="svelte-13ul1lp">${each($configuration.trsButtons, (button, index) => {
            return `${device && index < device.buttonCount ? `${validate_component(ControlButton, "ControlButton").$$render($$result, { button, index }, {}, {})}` : ``}`;
          })}</div>` : ``}`;
        }
      })}`;
    }
  })}

${validate_component(Readout, "Readout").$$render($$result, {}, {}, {})}`;
});
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: "#head.svelte-wd7jzg.svelte-wd7jzg{margin-bottom:1rem;border-bottom:1px solid #ccc;display:flex;flex:initial}#head.svelte-wd7jzg h1.svelte-wd7jzg{flex:1 0;margin:0 0 1rem}main.svelte-wd7jzg.svelte-wd7jzg{width:75%;margin:0 auto;min-width:calc(16 * 75px);display:flex;flex-direction:column;height:calc(100vh - 5rem)}#inner.svelte-wd7jzg.svelte-wd7jzg{flex:1}#foot.svelte-wd7jzg.svelte-wd7jzg{flex:initial;font-size:80%;border-top:1px solid #ccc;padding:1rem 0;display:flex}.foot-left.svelte-wd7jzg.svelte-wd7jzg{flex:1}.notice.svelte-wd7jzg.svelte-wd7jzg{text-align:center;margin-top:6rem}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $webMidiEnabled, $$unsubscribe_webMidiEnabled;
  let $configuration, $$unsubscribe_configuration;
  let $editMode, $$unsubscribe_editMode;
  $$unsubscribe_webMidiEnabled = subscribe(webMidiEnabled, (value) => $webMidiEnabled = value);
  $$unsubscribe_configuration = subscribe(configuration, (value) => $configuration = value);
  $$unsubscribe_editMode = subscribe(editMode, (value) => $editMode = value);
  const buildVersion = "2.0.0";
  $$result.css.add(css);
  $$unsubscribe_webMidiEnabled();
  $$unsubscribe_configuration();
  $$unsubscribe_editMode();
  return `<main class="svelte-wd7jzg"><div id="head" class="svelte-wd7jzg"><h1 class="svelte-wd7jzg">8mu configuration tool</h1>
    ${validate_component(DeviceDetails, "DeviceDetails").$$render($$result, {}, {}, {})}</div>

  <div id="inner" class="svelte-wd7jzg">${$webMidiEnabled ? `${$configuration ? `
        ${$editMode ? `${validate_component(Editing, "Editing").$$render($$result, {}, {}, {})}` : `${validate_component(Viewing, "Viewing").$$render($$result, {}, {}, {})}`}
        <p></p>` : `
        <p class="notice svelte-wd7jzg">Searching for a controller via USB, hang on a second or ten...<br><br>
          If you haven&#39;t plugged in your 8mu, do it now.<br><br><br>
          <img src="https://www.musicthing.co.uk/images/8mu_editor_crop.png"></p>`}` : `
      <p class="notice svelte-wd7jzg">WebMIDI could not be enabled. Please use a web browser that supports
        WebMIDI, such as Google Chrome.
      </p>`}</div>

  <div id="foot" class="svelte-wd7jzg"><div class="foot-left svelte-wd7jzg">8mu Editor v${escape(buildVersion)} <br>Having any trouble? Please try <a href="https://tomwhitwell.github.io/test-host/">v1.0.1</a> and <a href="https://github.com/TomWhitwell/8mu_Public/issues">let me know</a>.
    </div></div>
</main>`;
});
export {
  Page as default
};
