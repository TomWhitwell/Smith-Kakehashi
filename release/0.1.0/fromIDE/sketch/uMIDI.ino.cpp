#include <Arduino.h>
#line 1 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/uMIDI.ino"
#line 1 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/uMIDI.ino"
/*
  Music Thing Modular 8mu Firmware
  (c)Tom Whitwell March 2021
  MIT License
  Includes lots of code and inspiration from
  16n Faderbank Firmware Configuration
  (c) 2017,2018,2020 by Brian Crabtree, Sean Hellfritsch, Tom Armitage, and Brendon Cassidy
  MIT License
*/
/*
   Using library ResponsiveAnalogRead at version 1.2.1
   Using library Adafruit_SPIFlash at version 3.3.3
   Using library Bounce2 at version 2.53
   Using library BMI160-Arduino-master
   Using library Adafruit_TinyUSB_Library at version 0.10.0
*/

#include "uMidi.h"
#include <ResponsiveAnalogRead.h>
#include "EEPROMFlash.h"
#include <Bounce2.h>
#include <BMI160Gen.h>

// Create Midi
uMidi myMidi;

// Access two eeprom-like stores in on the internal flash memory
EEPROMFlash EEPROM;
EEPROMFlash BANK_STORE;

// activates printing of debug messages
#define DEBUG 1

// wrap code to be executed only under DEBUG conditions in D()
#ifdef DEBUG
#define D(x) x
#else
#define D(x)
#endif

// Config variables
int MAJOR_VERSION = 0x00;
int MINOR_VERSION = 0x01;
int POINT_VERSION = 0x00;
const int DEVICE_ID = 0x04; // 16n:  0x04 = 8n
const int midiFlashDuration = 50;


// Hardware variables
const int channelCount = 16;

#define NUM_LEDS 8
const byte leds[8] = {0, 1, 5, 7, 10, 11, 12, 13};

#define NUM_BUTTONS 6 // all buttons 
const byte buttonPins[6] = {29, 30, 28, 2, 31, 3}; // A, B, C, D, Left, Right
Bounce * buttons = new Bounce[NUM_BUTTONS];
const int longPush = 1000;
const int buttonCount = 4; // output buttons

// Pins for faders
const byte faders[8] = {A0, A1, A2, A3, A4, A5, A10, A11};

// Holds raw readings from 6-axis accelerometer
int IMU_readings[6];

// Smooth the two types of analog input
ResponsiveAnalogRead *analog[channelCount];

// System variables
int usbChannels[channelCount];
int trsChannels[channelCount];
int usbCCs[channelCount];
int trsCCs[channelCount];
int volatile currentValue[channelCount];
int lastMidiValue[channelCount];

int buttonUSBChannels[buttonCount];
int buttonTRSChannels[buttonCount];
int buttonUSBMode[buttonCount];
int buttonTRSMode[buttonCount];
int buttonUSBParamA[buttonCount];
int buttonTRSParamA[buttonCount];
int buttonUSBParamB[buttonCount];
int buttonTRSParamB[buttonCount];

// Legacy 16n variables, may change
int flip;
int ledOn;
int ledFlash;
int i2cMaster;
int midiThru;
int midiMode;
int dxMode;
const int adcResolutionBits = 12; // 12 bit ADC resolution on SAMD21
int faderMin;
int faderMax;

// run variables
bool forceMidiWrite = false;
int shiftyTemp, notShiftyTemp;
int midiInterval = 1000; // 1ms
bool shouldDoMidiRead = false;
bool shouldDoMidiWrite = false;
unsigned long midiTimerClock;
bool midiBlink[NUM_LEDS]; // should this led be blinking
const int midiBlinkTime = 50; // How long led blinks after a midi send
unsigned long lastMidiActivity;
unsigned long lastBlink; // Since blinks in teach mode
const int teachBlinkTime = 200; // speed of LED blinking when in Teach Mode
boolean teachBlink = true;


// Variables to track page changes and Teach Mode
int page = 0;
unsigned long pageChange = millis();
int tempPage = page;
const int pageChangeTime = 700;
const int buttonHoldTime = 700;
boolean changingPage = false; // true while the page change process is in progress - button pressed but not yet settled
boolean longHeld = true;
boolean pageChanged = true; // true after the page has changed. Only send config to editor if page has changed.
unsigned int lastSysex = 0; // allows pageChanged to timeout after some time
const int pageChangedTimeout = 10000;
// In teach mode, the IMU outputs are mapped to the faders to make it easier to use midi learn functions
enum ledModes {normal, teachFader, teachIMU} teachMode = normal;



#line 130 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/uMIDI.ino"
void setup();
#line 191 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/uMIDI.ino"
void loop();
#line 275 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/uMIDI.ino"
void writeMidi();
#line 30 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/configuration.ino"
void checkDefaultSettings();
#line 48 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/configuration.ino"
void initializeFactorySettings();
#line 179 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/configuration.ino"
void initializeFactorySettingsFast();
#line 309 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/configuration.ino"
void loadSettingsFromEEPROM();
#line 8 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/sysex.ino"
void processIncomingSysex(byte* sysexData, unsigned size);
#line 47 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/sysex.ino"
void updateAllSettingsAndStoreInEEPROM(byte* newConfig, unsigned size);
#line 58 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/sysex.ino"
void updateSettingsBlockAndStoreInEEPROM(byte* configFromSysex, unsigned sysexSize, int configStartIndex, int configDataLength, int EEPROMStartIndex);
#line 85 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/sysex.ino"
void sendCurrentState();
#line 1 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void printHex(uint8_t num);
#line 8 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void printHexArray(byte* array, int size);
#line 16 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void printBytesAsIntsArray(byte* array, int size);
#line 24 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void printIntArray(int* array, int size);
#line 32 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void readEEPROMArray(int start, byte buffer[], int length);
#line 38 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void writeEEPROMArray(int start, byte buffer[], int length);
#line 45 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
int gesture(byte num);
#line 81 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void calibrateIMU();
#line 176 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void allLeds(boolean state);
#line 182 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void ledRandom();
#line 188 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void ledAnimate(int target);
#line 202 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void checkPage();
#line 283 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void doLeds();
#line 130 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/uMIDI.ino"
void setup() {
  //  D(delay(5000));

  // Set resolution
  analogReadResolution(adcResolutionBits);

  // Setup smoothing and initialise variables
  for (int i = 0; i < channelCount; i++)
  {
    analog[i] = new ResponsiveAnalogRead(0, true, .001);
    analog[i]->setAnalogResolution(1 << adcResolutionBits);
    analog[i]->setActivityThreshold(8 << (adcResolutionBits - 10));
    currentValue[i] = 0;
    lastMidiValue[i] = 0;
  }

  // Setup Leds as output pins
  for (int i = 0; i < 8; i++) {
    pinMode(leds[i], OUTPUT);
  }

  // Start Midi
  myMidi.begin();

  // Setup Buttons as input pins
  // Setup buttons after MIDI because we need to remap Pin 3 to button R
  for (int i = 0; i < NUM_BUTTONS; i++) {
    buttons[i].attach( buttonPins[i] , INPUT_PULLUP  );
    buttons[i].interval(25);
  }
  // let the buttons settle
  delay(50);

  // Setup Acellerometer
  // Setup acellerometer after buttons to allow calibration
  BMI160.begin(BMI160GenClass::I2C_MODE);
  BMI160.setGyroRange(250);
  // Calibrate if Button A held down on startup
  if (!buttons[0].read()) calibrateIMU();

  // Initialise the two stores
  EEPROM.begin("EEPROM.cfg");
  BANK_STORE.begin("BANK.cfg");

  // If they don't exist, create them and fill with FFs
  // Config store = 1kb of space
  if (!EEPROM.exists()) EEPROM.create(1024);
  // Bank store = 1 byte of space
  if (!BANK_STORE.exists()) BANK_STORE.create(1);

  // Read defaults from the virtual EEPRPOM
  checkDefaultSettings();
  loadSettingsFromEEPROM();

  // Implement new settings
  myMidi._midiThru = midiThru;


}


void loop() {

  // Poll to check and send midi every midiInterval
  if (micros() - midiTimerClock > midiInterval) {
    midiTimerClock = micros();
    writeMidi();
    // Check for Sysex Configuration messages
    myMidi.newMessage();
    if (myMidi.sysexAvailable()) processIncomingSysex(myMidi.returnSysex(), sizeof(myMidi.returnSysex()));
    // update LEDs
    doLeds();
  }

  // Check buttons for page/bank changes
  checkPage();

  // Read Faders
  for (int j = 0; j < 8; j++) {
    int thisFader = abs((7 * flip) - j);
    analog[j]->update(analogRead(faders[thisFader]));
    int temp = analog[j]->getValue();
    temp = constrain(temp, faderMin, faderMax);
    temp = map(temp, faderMin, faderMax, 0, 1 << adcResolutionBits);
    if (!flip) temp = (1 << adcResolutionBits) - temp;
    currentValue[j] = temp;
  }

  // Read Accelerometer
  BMI160.readMotionSensor(IMU_readings[3], IMU_readings[4], IMU_readings[5], IMU_readings[0], IMU_readings[1], IMU_readings[2]);
  for (int j = 0; j < 8 ; j++) {
    analog[j + 8]->update(gesture(j));
    int temp = analog[j + 8]->getValue();
    temp = constrain(temp, faderMin, faderMax);
    temp = map(temp, faderMin, faderMax, 0, 1 << adcResolutionBits);
    currentValue[j + 8] = temp;
  }


  // Read buttons
  for (int i = 0; i < buttonCount; i++) {
    // Check what's happend to the button
    buttons[i].update();

    // When the button goes down, send noteOns or CCs according to mode
    if (buttons[i].fell()) {
      switch (buttonUSBMode[i]) {
        case 0:
          // send usb CC
          myMidi.CC(buttonUSBChannels[i], buttonUSBParamA[i], buttonUSBParamB[i]);
          break;
        case 1:
          // send usb note
          myMidi.noteOn(buttonUSBChannels[i], buttonUSBParamA[i], buttonUSBParamB[i]);
          break;
      }

      switch (buttonTRSMode[i]) {
        case 0:
          // send TRS CC
          myMidi.hardCC(buttonTRSChannels[i], buttonTRSParamA[i], buttonTRSParamB[i]);
          break;
        case 1:
          // send TRS note
          myMidi.hardNoteOn(buttonTRSChannels[i], buttonTRSParamA[i], buttonTRSParamB[i]);
          break;
      }
    }

    // When the button comes up, just need to send note offs
    if (buttons[i].rose()) {
      if (buttonUSBMode[i] == 1) {
        // send usb noteOff
        myMidi.noteOff(buttonUSBChannels[i], buttonUSBParamA[i]);
      }

      if (buttonTRSMode[i] == 1) {
        // send TRS noteOff
        myMidi.hardNoteOff(buttonTRSChannels[i], buttonTRSParamA[i]);
      }
    }
  }

}

void writeMidi() {
  for (int q = 0; q < channelCount; q++)
  {

    midiBlink[q] = false;
    notShiftyTemp = currentValue[q];

    // shift for MIDI precision (0-127)
    shiftyTemp = notShiftyTemp >> 5;

    // if there was a change in the midi value
    if ((shiftyTemp != lastMidiValue[q]) || forceMidiWrite)
    {

      switch (teachMode) {

        case normal:

          // send the message over USB
          myMidi.CC(usbChannels[q], usbCCs[q], shiftyTemp);
          // send the message over physical midi
          myMidi.hardCC(trsChannels[q], trsCCs[q], shiftyTemp);
          // store the shifted value for future comparison
          lastMidiValue[q] = shiftyTemp;
          //      D(Serial.printf("Fader[%d] Chan: %d CC: %d val: %d\n", q, usbChannels[q], usbCCs[q], shiftyTemp));
          midiBlink[q] = true;
          lastMidiActivity = millis();
          break;

        case teachFader:
          // In fader mode, only send fader movements, ignore IMU movements 
          if (q < 8) {
            // send the message over USB
            myMidi.CC(usbChannels[q], usbCCs[q], shiftyTemp);
            // send the message over physical midi
            myMidi.hardCC(trsChannels[q], trsCCs[q], shiftyTemp);
            // store the shifted value for future comparison
            lastMidiValue[q] = shiftyTemp;
            //      D(Serial.printf("Fader[%d] Chan: %d CC: %d val: %d\n", q, usbChannels[q], usbCCs[q], shiftyTemp));
          }


          break;

        case teachIMU:
          //in IMU mode, send fader movements through the IMU channels to make it easier to set up midi learn 
          if (q <8 ){

            // send the message over USB
            myMidi.CC(usbChannels[q+8], usbCCs[q+8], shiftyTemp);
            // send the message over physical midi
            myMidi.hardCC(trsChannels[q+8], trsCCs[q+8], shiftyTemp);
            // store the shifted value for future comparison
            lastMidiValue[q] = shiftyTemp;
            //      D(Serial.printf("Fader[%d] Chan: %d CC: %d val: %d\n", q, usbChannels[q], usbCCs[q], shiftyTemp));

            
          }
          break;


      }
    }

  }
  forceMidiWrite = false;
}

#line 1 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/configuration.ino"
/*
   16n Faderbank EEPROM-based configuration
   (c) 2020 by Tom Armitage
   (c) 2021 by Tom Whitwell
   MIT License
*/

const int defaultUSBCCs[] = {32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47};
const int defaultTRSCCs[] = {32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47};

const int defaultUSBChannels[] = {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1};
const int defaultTRSChannels[] = {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1};


const int defaultButtonUSBMode[] = {1, 1, 1, 1};
const int defaultButtonTRSMode[] = {1, 1, 1, 1};

const int defaultButtonUSBParamA[] = {24, 36, 48, 60};
const int defaultButtonUSBParamB[] = {64, 64, 64, 64};

const int defaultButtonTRSParamA[] = {24, 36, 48, 60};
const int defaultButtonTRSParamB[] = {64, 64, 64, 64};

const int defaultButtonUSBChannels[] = {1, 1, 1, 1};
const int defaultButtonTRSChannels[] = {1, 1, 1, 1};

const int bufferSize = 112;
const int bankCount = 8;

void checkDefaultSettings() {
  // if byte1 of EEPROM is FF for whatever reason, let's assume the machine needs initializing
  int firstByte = EEPROM.read(0x00);

  if (firstByte > 0x01) {
    D(Serial.println("First Byte is > 0x01, probably needs initialising"));
    initializeFactorySettingsFast();
  } else {
    D(Serial.print("First Byte is set to: "));
    D(printHex(firstByte));
    D(Serial.println());
    byte buffer[bufferSize];
    readEEPROMArray(0, buffer, bufferSize);
    D(Serial.println("Config found:"));
    D(printHexArray(buffer, bufferSize));
  }
}

void initializeFactorySettings() {
  BANK_STORE.write(0, 0); // Start in Page 0
  for (int bankToWrite = 0; bankToWrite < bankCount; bankToWrite++) {
    ledRandom();
    int b_off = bankToWrite * bufferSize;
    // set default config flags (LED ON, LED DATA, ROTATE, etc)
    // fadermin/max are based on "works for me" for twra2. Your mileage may vary.
    EEPROM.write(0 + b_off, 1); // LED ON
    EEPROM.write(1 + b_off, 1); // LED DATA
    EEPROM.write(2 + b_off, 0); // ROTATE
    EEPROM.write(3 + b_off, 0); // I2C follower by default
    EEPROM.write(4 + b_off, 15); // fadermin LSB
    EEPROM.write(5 + b_off, 0); // fadermin MSB
    EEPROM.write(6 + b_off, 122); // fadermax LSB
    EEPROM.write(7 + b_off, 31); // fadermax MSB
    EEPROM.write(8 + b_off, 1); // Soft midi thru
    EEPROM.write(9 + b_off, 1); // Midi Mode 1 = Arturia mode
    EEPROM.write(10 + b_off, 0); // DX7 Mode
    EEPROM.write(11 + b_off, bankToWrite); // Current Bank Number
    for (int i = 12; i < 16; i ++) {
      EEPROM.write(i + b_off, 0); // blank remaining config slots.
    }
    ledRandom();

    // set default USB channels
    for (int i = 0; i < channelCount; i++) {
      int baseAddress = 16;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultUSBChannels[i]);
    }
    ledRandom();

    // set default TRS channels
    for (int i = 0; i < channelCount; i++) {
      int baseAddress = 32;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultTRSChannels[i]);
    }
    ledRandom();

    // set default USB  ccs
    for (int i = 0; i < channelCount; i++) {
      int baseAddress = 48;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultUSBCCs[i]);
    }
    ledRandom();

    // set default TRS  ccs
    for (int i = 0; i < channelCount; i++) {
      int baseAddress = 64;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultTRSCCs[i]);
    }
    ledRandom();


    // set default Button usb channels
    for (int i = 0; i < buttonCount; i++) {
      int baseAddress = 80;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultButtonUSBChannels[i]);
    }
    ledRandom();

    // set default Button TRS channels
    for (int i = 0; i < buttonCount; i++) {
      int baseAddress = 84;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultButtonTRSChannels[i]);
    }
    ledRandom();

    // set default Button usb modes
    for (int i = 0; i < buttonCount; i++) {
      int baseAddress = 88;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultButtonUSBMode[i]);
    }
    ledRandom();

    // set default Button TRS modes
    for (int i = 0; i < buttonCount; i++) {
      int baseAddress = 92;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultButtonTRSMode[i]);
    }
    ledRandom();

    // set default Button USB Param A
    for (int i = 0; i < buttonCount; i++) {
      int baseAddress = 96;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultButtonUSBParamA[i]);
    }
    ledRandom();

    // set default Button TRS Param A
    for (int i = 0; i < buttonCount; i++) {
      int baseAddress = 100;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultButtonTRSParamA[i]);
    }
    ledRandom();

    // set default Button USB Param B
    for (int i = 0; i < buttonCount; i++) {
      int baseAddress = 104;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultButtonUSBParamB[i]);
    }

    // set default Button TRS Param B
    for (int i = 0; i < buttonCount; i++) {
      ledRandom();
      int baseAddress = 108;
      int writeAddress = baseAddress + i;
      EEPROM.write(writeAddress + b_off, defaultButtonTRSParamB[i]);
    }

  }
  allLeds(0);
  // serial dump that config.
  byte buffer[bufferSize];
  readEEPROMArray(0, buffer, bufferSize);
  D(Serial.println("Config Instantiated."));
  D(Serial.print(bankCount));
  D(Serial.println(" copies of:"));
  D(printHexArray(buffer, bufferSize));
}

void initializeFactorySettingsFast() {
  BANK_STORE.write(0, 0); // Start in Page 0

  byte bytesToWrite[bufferSize];

  // set default config flags (LED ON, LED DATA, ROTATE, etc)
  // fadermin/max are based on "works for me" for twra2. Your mileage may vary.
  bytesToWrite[0] = 1; // LED ON
  bytesToWrite[1] = 1; // LED DATA
  bytesToWrite[2] = 0; // ROTATE
  bytesToWrite[3] = 0; // I2C follower by default
  bytesToWrite[4] = 15; // fadermin LSB
  bytesToWrite[5] = 0; // fadermin MSB
  bytesToWrite[6] = 122; // fadermax LSB
  bytesToWrite[7] = 31; // fadermax MSB
  bytesToWrite[8] = 1; // Soft midi thru
  bytesToWrite[9] = 1; // Midi Mode 1 = Arturia mode
  bytesToWrite[10] = 0; // DX7 Mode



  for (int i = 12; i < 16; i ++) {
    bytesToWrite[i] =  0; // blank remaining config slots.
  }

  // set default USB channels
  for (int i = 0; i < channelCount; i++) {
    int baseAddress = 16;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] = defaultUSBChannels[i];
  }

  // set default TRS channels
  for (int i = 0; i < channelCount; i++) {
    int baseAddress = 32;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] = defaultTRSChannels[i];
  }

  // set default USB  ccs
  for (int i = 0; i < channelCount; i++) {
    int baseAddress = 48;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] = defaultUSBCCs[i];
  }

  // set default TRS  ccs
  for (int i = 0; i < channelCount; i++) {
    int baseAddress = 64;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] = defaultTRSCCs[i];
  }


  // set default Button usb channels
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 80;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] = defaultButtonUSBChannels[i];
  }

  // set default Button TRS channels
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 84;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] = defaultButtonTRSChannels[i];
  }

  // set default Button usb modes
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 88;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] =  defaultButtonUSBMode[i];
  }

  // set default Button TRS modes
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 92;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] = defaultButtonTRSMode[i];
  }

  // set default Button USB Param A
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 96;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] = defaultButtonUSBParamA[i];
  }

  // set default Button TRS Param A
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 100;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] = defaultButtonTRSParamA[i];
  }

  // set default Button USB Param B
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 104;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] = defaultButtonUSBParamB[i];
  }

  // set default Button TRS Param B
  for (int i = 0; i < buttonCount; i++) {
    ledRandom();
    int baseAddress = 108;
    int writeAddress = baseAddress + i;
    bytesToWrite[writeAddress] = defaultButtonTRSParamB[i];
  }



  for (int bankToWrite = 0; bankToWrite < bankCount; bankToWrite++) {
    int b_off = bankToWrite * bufferSize;
    EEPROM.writeArray(b_off, bytesToWrite, bufferSize);
    EEPROM.write(11 + b_off, bankToWrite); // Current Bank Number
    ledRandom();
  }


  // serial dump that config.
  byte buffer[bufferSize];
  readEEPROMArray(0, buffer, bufferSize);
  D(Serial.println("Config Instantiated."));
  D(Serial.print(bankCount));
  D(Serial.println(" copies of:"));
  D(printHexArray(buffer, bufferSize));
}

void loadSettingsFromEEPROM() {
  // load current page
  page = BANK_STORE.read(0);
  D(Serial.print("Active page loaded = "));
  D(Serial.println(page));
  allLeds(0);
  ledAnimate(page);
  digitalWrite(leds[page], HIGH);

  int b_off = page * bufferSize;


  // load usb channels
  for (int i = 0; i < channelCount; i++) {
    int baseAddress = 16;
    int readAddress = baseAddress + i + b_off;
    usbChannels[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("USB Channels loaded:"));
  D(printIntArray(usbChannels, channelCount));

  // load TRS channels
  for (int i = 0; i < channelCount; i++) {
    int baseAddress = 32;
    int readAddress = baseAddress + i + b_off;
    trsChannels[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("TRS Channels loaded:"));
  D(printIntArray(trsChannels, channelCount));

  // load USB ccs
  for (int i = 0; i < channelCount; i++) {
    int baseAddress = 48;
    int readAddress = baseAddress + i + b_off;
    usbCCs[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("USB CCs loaded:"));
  D(printIntArray(usbCCs, channelCount));


  // load TRS ccs
  for (int i = 0; i < channelCount; i++) {
    int baseAddress = 64;
    int readAddress = baseAddress + i + b_off;
    trsCCs[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("TRS CCs loaded:"));
  D(printIntArray(trsCCs, channelCount));

  // ** Buttons **
  // load Button USB Channels
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 80;
    int readAddress = baseAddress + i + b_off;
    buttonUSBChannels[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("Button USB Channels loaded:"));
  D(printIntArray(buttonUSBChannels, buttonCount));

  // load Button TRS Channels
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 84;
    int readAddress = baseAddress + i + b_off;
    buttonTRSChannels[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("Button TRS Channels loaded:"));
  D(printIntArray(buttonTRSChannels, buttonCount));

  // load Button USB Modes
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 88;
    int readAddress = baseAddress + i + b_off;
    buttonUSBMode[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("Button USB Modes loaded:"));
  D(printIntArray(buttonUSBMode, buttonCount));

  // load Button TRS Modes
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 92;
    int readAddress = baseAddress + i + b_off;
    buttonTRSMode[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("Button TRS Modes loaded:"));
  D(printIntArray(buttonTRSMode, buttonCount));

  // load Button USB Param A
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 96;
    int readAddress = baseAddress + i + b_off;
    buttonUSBParamA[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("Button USB ParamA loaded:"));
  D(printIntArray(buttonUSBParamA, buttonCount));

  // load Button TRS Param A
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 100;
    int readAddress = baseAddress + i + b_off;
    buttonTRSParamA[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("Button TRS ParamA loaded:"));
  D(printIntArray(buttonTRSParamA, buttonCount));

  // load Button USB Param B
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 104;
    int readAddress = baseAddress + i + b_off;
    buttonUSBParamB[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("Button USB ParamB loaded:"));
  D(printIntArray(buttonUSBParamB, buttonCount));

  // load Button TRS Param B
  for (int i = 0; i < buttonCount; i++) {
    int baseAddress = 108;
    int readAddress = baseAddress + i + b_off;
    buttonTRSParamB[i] = EEPROM.read(readAddress);
  }

  D(Serial.println("Button TRS ParamB loaded:"));
  D(printIntArray(buttonTRSParamB, buttonCount));

  // load other config
  ledOn = EEPROM.read(0 + b_off);
  ledFlash = EEPROM.read(1 + b_off);
  flip = EEPROM.read(2 + b_off);
  myMidi._midiThru = EEPROM.read(8 + b_off);
  midiMode = EEPROM.read(9 + b_off);
  dxMode = EEPROM.read(10 + b_off);
  
  // Set the current page to the page recieved from the Editor 
  page = EEPROM.read(11 + b_off);
  // Ensure we don't confuse page switching system 
  tempPage = page; 
  
  // i2cMaster only read at startup

  int faderminLSB = EEPROM.read(4 + b_off);
  int faderminMSB = EEPROM.read(5 + b_off);

  D(Serial.print ("Setting fadermin to "));
  D(Serial.println((faderminMSB << 7) + faderminLSB));
  faderMin = (faderminMSB << 7) + faderminLSB;

  int fadermaxLSB = EEPROM.read(6);
  int fadermaxMSB = EEPROM.read(7);

  D(Serial.print ("Setting fadermax to "));
  D(Serial.println((fadermaxMSB << 7) + fadermaxLSB));
  faderMax = (fadermaxMSB << 7) + fadermaxLSB;
}

#line 1 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/sysex.ino"
/*
   16n Faderbank Configuration Sysex Processing
   (c) 2020 by Tom Armitage
   (c) 2021 by Tom Whitwell
   MIT License
*/

void processIncomingSysex(byte* sysexData, unsigned size) {
  D(Serial.println("Ooh, sysex"));
  D(printHexArray(sysexData, size));
  D(Serial.println());

  if (size < 3) {
    D(Serial.println("That's an empty sysex, bored now"));
    return;
  }

  // if(!(sysexData[1] == 0x00 && sysexData[2] == 0x58 && sysexData[3] == 0x49)) {
  if (!(sysexData[1] == 0x7d && sysexData[2] == 0x00 && sysexData[3] == 0x00)) {
    D(Serial.println("That's not a sysex message for us"));
    return;
  }

  switch (sysexData[4]) {
    case 0x1f:
      // 1F = "1nFo" - please send me your current config
      D(Serial.println("Got an 1nFo request"));
      if (pageChanged || millis() - lastSysex > pageChangedTimeout) {
      sendCurrentState();
      pageChanged = false;
      lastSysex = millis();         
      }
      break;
    case 0x0e:
      // 0E - c0nfig Edit - here is a new config
      D(Serial.println("Incoming c0nfig Edit"));
      updateAllSettingsAndStoreInEEPROM(sysexData, size);
      break;
    case 0x1a:
      // 1A - 1nitiAlize - blank EEPROM and reset to factory settings.
      D(Serial.println("Incoming 1nitiAlize request"));
      initializeFactorySettings();
      break;
  }
}

void updateAllSettingsAndStoreInEEPROM(byte* newConfig, unsigned size) {
  // store the settings from sysex in flash
  // also update all our settings.
  D(Serial.print("Received a new config with size "));
  D(Serial.println(size));
  // D(printHexArray(newConfig,size));

  // Changed to add bufferSize
  updateSettingsBlockAndStoreInEEPROM(newConfig, size, 9, bufferSize, 0);
}

void updateSettingsBlockAndStoreInEEPROM(byte* configFromSysex, unsigned sysexSize, int configStartIndex, int configDataLength, int EEPROMStartIndex) {
  int b_off = page * bufferSize;
  EEPROMStartIndex = EEPROMStartIndex + b_off;
  D(Serial.print("Storing data of size "));
  D(Serial.print(configDataLength));
  D(Serial.print(" at location "));
  D(Serial.print(EEPROMStartIndex));
  D(Serial.print(" from data of length "));
  D(Serial.print(sysexSize));
  D(Serial.print(" beginning at byte "));
  D(Serial.println(configStartIndex));
  D(printHexArray(configFromSysex, sysexSize));

  // walk the config, ignoring the top, tail, and firmware version
  byte dataToWrite[configDataLength];

  for (int i = 0; i < (configDataLength); i++) {
    int configIndex = i + configStartIndex;
    dataToWrite[i] = configFromSysex[configIndex];
  }

  // write new Data
  writeEEPROMArray(EEPROMStartIndex, dataToWrite, configDataLength);

  // now load that.
  loadSettingsFromEEPROM();
}
void sendCurrentState() {
  //   0F - "c0nFig" - outputs its config:

  byte sysexData[8 + bufferSize];


  sysexData[0] = 0x7d; // manufacturer
  sysexData[1] = 0x00;
  sysexData[2] = 0x00;

  sysexData[3] = 0x0F; // ConFig;

  sysexData[4] = DEVICE_ID; // Device 01, ie, dev board
  sysexData[5] = MAJOR_VERSION; // major version
  sysexData[6] = MINOR_VERSION; // minor version
  sysexData[7] = POINT_VERSION; // point version

  byte buffer[bufferSize];
  int b_off = page * bufferSize;

  readEEPROMArray(b_off, buffer, bufferSize);

  int offset = 8;
  for (int i = 0; i < bufferSize; i++) {
    byte data = buffer[i];
    if (data == 0xff) {
      data = 0x7f;
    }
    sysexData[i + offset] = data;
  }
  byte howMuchToSend = 120;

  D(Serial.println("Sending this data"));
  D(printBytesAsIntsArray(sysexData, howMuchToSend));
  myMidi.sendSysEx(howMuchToSend, sysexData);
  //  myMidi.sendSysEx(bufferSize+8, sysexData);
  forceMidiWrite = true;
}

#line 1 "/Users/tom/Documents/GitHub/Phone-sized-MidiControl/Firmware/Arduino for MTM 8mu Plus/uMIDI/utils.ino"
void printHex(uint8_t num) {
  char hexCar[2];

  sprintf(hexCar, "%02X", num);
  D(Serial.print(hexCar));
}

void printHexArray(byte* array, int size) {
  for (int i = 0; i < size; i++) {
    printHex(array[i]);
    D(Serial.print(" "));
  }
  D(Serial.println());
}

void printBytesAsIntsArray(byte* array, int size) {
  for (int i = 0; i < size; i++) {
    Serial.print(array[i]);
    D(Serial.print(" "));
  }
  D(Serial.println());
}

void printIntArray(int* array, int size) {
  for (int i = 0; i < size; i++) {
    Serial.print(array[i]);
    D(Serial.print("\t"));
  }
  D(Serial.println());
}

void readEEPROMArray(int start, byte buffer[], int length) {
  for (int i = 0; i < length; i++) {
    buffer[i] = EEPROM.read(start + i);
  }
}

void writeEEPROMArray(int start, byte buffer[], int length) {
  for (int i = 0; i < length; i++) {
    EEPROM.write(start + i, buffer[i]);
  }
}

// Convert raw IMU results to meaninful gestures
int gesture(byte num) {
  switch (num) {
    case 0: // Lift Front
      return abs(constrain(IMU_readings[4], -16256, 0)) >> 2;
      break;

    case 1: // Lift Back
      return constrain(IMU_readings[4], 0, 16256) >> 2;
      break;

    case 2:// Lift Right
      return abs(constrain(IMU_readings[3], -16256, 0)) >> 2;
      break;

    case 3: // lift Left
      return constrain(IMU_readings[3], 0, 16256) >> 2;
      break;

    case 4: // Rotate clockwise
      return constrain(IMU_readings[2] >> 1, 0, 16256) >> 2;
      break;

    case 5: // Rotate Anti-Clockwise
      return abs(constrain(IMU_readings[2] >> 1, -16256, 0)) >> 2;
      break;

    case 6: // Turn Over
      return constrain(IMU_readings[5], 0, 16256) >> 2;
      break;

    case 7: // Right way up
      return abs(constrain(IMU_readings[5], -16256, 0)) >> 2;
      break;
  }
}

void calibrateIMU() {
  delay(1000);
  D(Serial.println("Internal sensor offsets BEFORE calibration..."));
  D(Serial.print(BMI160.getXAccelOffset()));
  D(Serial.print("\t"));
  D(Serial.print(BMI160.getYAccelOffset()));
  D(Serial.print("\t"));
  D(Serial.print(BMI160.getZAccelOffset()));
  D(Serial.print("\t"));
  D(Serial.print(BMI160.getXGyroOffset()));
  D(Serial.print("\t"));
  D(Serial.print(BMI160.getYGyroOffset()));
  D(Serial.print("\t"));
  D(Serial.println(BMI160.getZGyroOffset()));
  D(Serial.print("Starting Acceleration calibration..."));
  BMI160.autoCalibrateXAccelOffset(0);
  BMI160.autoCalibrateYAccelOffset(0);
  BMI160.autoCalibrateZAccelOffset(2);
  D(Serial.println(" Done"));
  D(Serial.println("Internal sensor offsets AFTER calibration..."));
  D(Serial.print(BMI160.getXAccelOffset()));
  D(Serial.print("\t")); // -76
  D(Serial.print(BMI160.getYAccelOffset()));
  D(Serial.print("\t")); // -2359
  D(Serial.print(BMI160.getZAccelOffset()));
  D(Serial.print("\t")); // 1688
  D(Serial.print(BMI160.getXGyroOffset()));
  D(Serial.print("\t")); // 0
  D(Serial.print(BMI160.getYGyroOffset()));
  D(Serial.print("\t")); // 0
  D(Serial.println(BMI160.getZGyroOffset()));
  D(Serial.println("Enabling Gyroscope/Acceleration offset compensation"));
  BMI160.setGyroOffsetEnabled(true);
  BMI160.setAccelOffsetEnabled(true);
  // Blinkenlights
  for (int i = 0; i < 8; i++) {
    for (int j = 0; j < 4; j++) {
      digitalWrite(leds[3 - j], HIGH);
      digitalWrite(leds[4 + j], HIGH);
      delay(30);
      digitalWrite(leds[3 - j], LOW);
      digitalWrite(leds[4 + j], LOW);
      delay(30);
    }
  }
}

// Returns max value for each DX7 parameter
const int dxLookup[] = {99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 3, 3, 7, 3, 7, 99,
                        1, 31, 99, 14, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 3, 3, 99, 99, 7, 99, 1, 31,
                        99, 14, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 3, 3, 99, 99, 7, 99, 1, 31, 99, 14,
                        99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 3, 3, 99, 99, 7, 99, 1, 31, 99, 14, 99, 99,
                        99, 99, 99, 99, 99, 99, 99, 99, 99, 3, 3, 99, 99, 7, 99, 1, 31, 99, 14, 99, 99, 99, 99,
                        99, 99, 99, 99, 99, 99, 99, 3, 3, 99, 99, 7, 99, 1, 31, 99, 14, 99, 99, 99, 99, 99, 99,
                        99, 99, 31, 7, 1, 99, 99, 99, 99, 1, 4, 99
                       };


//void dxSysex(uint8_t param, uint8_t value) {
//  byte DXSYSEX[] = {0x43, 0x10, 0x00, 0x00, 0x00};
//  DXSYSEX[2] = (param >= 128 ? 0x01 : 0x00);
//  DXSYSEX[3] = 0x7f & param;
//  DXSYSEX[4] = 0x7f & value;
//  myMidi.sendSysEx(5,DXSYSEX);
//};
//


//void make_sysex_message(uint8_t param, uint8_t value, uint8_t *buf, bool voice_param) {
//  buf[0] = 0x43; // Yamaha identifier
//  buf[1] = 0x10; // Sub-status 1, channel number 1
//  buf[2] = ((voice_param ? 0 : 2) << 2) | (param >= 128 ? 1 : 0);
//  buf[3] = 0x7f & param;
//  buf[4] = 0x7f & value;
//}


/*
  def dx_sysex(self, parameter, value):
    DXSYSEX = [0x43, 0x10, 0x00, 0x00, 0x00]
    if parameter>127:
        DXSYSEX[2] = 0x01
    DXSYSEX[3] = parameter & 0x7f
    DXSYSEX[4] = value
    self._outbuf[0] = 0xf0
    self._outbuf[1] = DXSYSEX[0]
    self._outbuf[2] = DXSYSEX[1]
    self._outbuf[3] = DXSYSEX[2]
    self._outbuf[4] = DXSYSEX[3]
    self._outbuf[5] = DXSYSEX[4]
    self._outbuf[6] = 0xf7
    self._send(self._outbuf, 7)

*/

void allLeds(boolean state) {
  for (int ledscan = 0; ledscan < NUM_LEDS; ledscan++) {
    digitalWrite(leds[ledscan], state);
  }
}

void ledRandom() {
  for (int ledscan = 0; ledscan < NUM_LEDS; ledscan++) {
    digitalWrite(leds[ledscan], random(2));
  }
}

void ledAnimate(int target) {
  // LED animate
  for (int q = 0; q < NUM_LEDS; q++) {
    digitalWrite(leds[constrain(target + q, 0, NUM_LEDS)], HIGH);
    digitalWrite(leds[constrain(target - q, 0, NUM_LEDS)], HIGH);
    delay(25);
  }
  for (int q = 0; q < NUM_LEDS; q++) {
    digitalWrite(leds[constrain(target + q, 0, NUM_LEDS)], LOW);
    digitalWrite(leds[constrain(target - q, 0, NUM_LEDS)], LOW);
    delay(25);
  }
}

void checkPage() {

  // Check button state
  buttons[4].update();
  buttons[5].update();

  enum DataButtonState {
    doNothing,
    dataIncrement,
    dataDecrement,
    bothPressed
  } buttonState = doNothing;

  // Display currently active page and wipe any existing LEDS
  if (changingPage) {
    allLeds(LOW);
    digitalWrite(leds[tempPage], HIGH);
  }

  // Check on button up for tapped up/down
  if (buttons[4].rose()) {
    buttonState = dataDecrement;
    pageChange = millis();
  }

  if (buttons[5].rose()) {
    buttonState = dataIncrement;
    pageChange = millis();
  }

  // Check if R button held down
  // longHeld stops page increment/decrement when  button is released
  if (buttons[5].read() == 0
      && buttons[5].duration() > buttonHoldTime
      && longHeld == false
     ) {
    buttonState = bothPressed;
    longHeld = true;
  }

  // Reset longHeld by pressing  button
  if (buttons[5].fell()) longHeld = false;

  switch (buttonState) {
    case doNothing:
      break;
    case dataIncrement:
      tempPage ++;
      break;
    case dataDecrement:
      tempPage --;
      break;
    case bothPressed:
      if (teachMode == normal) teachMode = teachFader;
      else if (teachMode == teachFader) teachMode = teachIMU;
      else if (teachMode == teachIMU) teachMode = normal;
      return;
      break;
  }

  // Wrap aroung page changes
  if (tempPage < 0) tempPage = 7;
  if (tempPage > 7) tempPage = 0;

  // Ensure no page changes caused two buttons being held down are released
  if (longHeld) tempPage = page;
  if (tempPage != page) changingPage = true;

  // Time's up: do a page change if necessary
  if (millis() - pageChange > pageChangeTime && changingPage) {
    page = tempPage;
    changingPage = false;
    BANK_STORE.write(0, page); // update EEPROM with new setting
    loadSettingsFromEEPROM();
    // Send new settings to editor ??
    ledAnimate(page);
    pageChanged = true;

  }
}

void doLeds() {
  switch (teachMode) {

    case normal:
      {
        boolean ledBlinking = (millis() - lastMidiActivity < midiBlinkTime);
        for (int i = 0; i < NUM_LEDS; i++) {
          digitalWrite(leds[i], (ledBlinking && midiBlink[i]));
        }
        break;
      }
    case teachFader:
      {
        if (millis() - lastBlink > teachBlinkTime) {
          for (int i = 0; i < NUM_LEDS; i++) {
            digitalWrite(leds[i], (i<4) && teachBlink);
          };
          lastBlink = millis();
          teachBlink = !teachBlink;
        }

        break;
      }
    case teachIMU:
      {
        if (millis() - lastBlink > teachBlinkTime) {
          for (int i = 0; i < NUM_LEDS; i++) {
            digitalWrite(leds[i], (i>3) && teachBlink);
          };
          lastBlink = millis();
          teachBlink = !teachBlink;
        }
      }
  }
}

