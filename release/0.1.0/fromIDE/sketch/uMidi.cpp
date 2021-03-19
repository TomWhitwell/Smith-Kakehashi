/*
   Ultralight Midi driver
   (c) 2021 by Tom Whitwell
   MIT License
*/


#include <Adafruit_TinyUSB.h>
#include <Arduino.h>
#include "wiring_private.h" // pinPeripheral() function
#include "uMidi.h"

Adafruit_USBD_MIDI usb_midi;

// Setup hardware UART on pins 3 recieve (not used) and 4 transmit (used)
Uart hardMidi (&sercom2, 3, 4, SERCOM_RX_PAD_1, UART_TX_PAD_0);

void SERCOM2_Handler()
{
  hardMidi.IrqHandler();
}


uMidi::uMidi() {
};

void uMidi::begin() {

  usb_midi.begin();

  // Start UART
  hardMidi.begin(31250);

  // Assign pins 3 & 4 to SERCOM functionality
  //  pinPeripheral(3, PIO_SERCOM_ALT); // RX, not used, so no need to assign
  pinPeripheral(4, PIO_SERCOM_ALT); // TX, used

  //  Setup pin 6 as current sink
  pinMode(6, OUTPUT);
  digitalWrite(6, 1);
}


// Channel number -1 because it came out + 1

void uMidi::noteOn (byte channel, byte pitch, byte velocity) {
  // Channel 0 used to turn MIDI outputs off 
  if (channel < 1) return; 
  int packetSize = 4;
  uint8_t packet[4] = {0x09, NOTE_ON | channel - 1, pitch, velocity};
  usb_midi.send(packet);
}

void uMidi::hardNoteOn(byte channel, byte pitch, byte velocity) {
  // Channel 0 used to turn MIDI outputs off 
  if (channel < 1) return; 
  hardMidi.write(NOTE_ON & 0xf0) | ((channel - 1) & 0x0f);
  hardMidi.write(pitch);
  hardMidi.write(velocity);
}


void uMidi::noteOff (byte channel, byte pitch) {
  // Channel 0 used to turn MIDI outputs off 
  if (channel < 1) return; 
  byte velocity = 0;
  int packetSize = 4;
  uint8_t packet[4] = {0x08, NOTE_OFF | channel - 1, pitch, velocity};
  usb_midi.send(packet);
}

void uMidi::hardNoteOff(byte channel, byte pitch) {
  // Channel 0 used to turn MIDI outputs off 
  if (channel < 1) return; 
  byte velocity = 0;
  hardMidi.write(NOTE_OFF & 0xf0) | ((channel - 1) & 0x0f);
  hardMidi.write(pitch);
  hardMidi.write(velocity);
}



void uMidi::CC (byte channel, byte controller, byte level) {
  // Channel 0 used to turn MIDI outputs off 
  if (channel < 1) return; 
  int packetSize = 4;
  uint8_t packet[4] = {0x0B, CONT_CONT | channel - 1, controller, level};
  usb_midi.send(packet);
}

void uMidi::hardCC(byte channel, byte controller, byte level) {
  // Channel 0 used to turn MIDI outputs off 
  if (channel < 1) return; 
  hardMidi.write(CONT_CONT & 0xf0) | ((channel - 1) & 0x0f);
  hardMidi.write(controller);
  hardMidi.write(level);
}


void uMidi::newMessage() {
  while (usb_midi.available()) {
    uint8_t packet[4];
    usb_midi.receive(packet);

    if (_midiThru) {
      hardMidi.write(packet[1]);
      hardMidi.write(packet[2]);
      hardMidi.write(packet[3]);
    }

    // Strip sysex from incoming bytes

    for (int i = 1; i < 4; i++) {
      if (recievingSysex == true && packet[i] == 0xF7) {
        midiBuffer[bufferLength++] = packet[i];
        recievingSysex = false;
        recievedSysex = true;
        //        D(Serial.println("sysex recieved "));
        //        printHexArray(midiBuffer, bufferLength);

      }

      if (recievingSysex == true) {
        if (bufferLength < bufferSize) {
          midiBuffer[bufferLength++] = packet[i];
        }
        else {
          D(Serial.println("*****BUFFER OVERFLOW*****"));
        }
      }
      if (packet[i] == 0xF0 && recievingSysex == false) {
        bufferLength = 0;
        midiBuffer[bufferLength++] = packet[i];
        recievingSysex = true;
        recievedSysex = false;
      }

    }
  }
}

void uMidi::sendSysEx(int length, byte *data) {

  D(Serial.print(length));
  D(Serial.println(" bytes of sysex to send"));

  // send F0 sysex header + first two bytes
  uint8_t packet[4] = {0x4, 0xF0, data[0], data[1]};
  usb_midi.send(packet);
  delay(1);
  D(Serial.print("Send packet: "));
  D(printBytesAsIntsArray(packet, 4));
  D(Serial.println(""));
  data += 2;
  length -= 2;

  // send the rest of the data
  while (length > 2) {
    uint8_t packet[4] = {0x4, data[0], data[1], data[2]};
    usb_midi.send(packet);
    delay(1);
    D(Serial.print("Send packet: "));
    D(printBytesAsIntsArray(packet, 4));
    D(Serial.println(""));
    data += 3;
    length -= 3;
  }
  // send leftovers and F7 sign off

  switch (length) {
    case 2:
      { uint8_t packet[4] = {0x7, data[0], data[1], 0xF7};
        usb_midi.send(packet);
        D(Serial.print("Send packet: "));
        D(printBytesAsIntsArray(packet, 4));
        D(Serial.println(""));
        break;
      }
    case 1:
      { uint8_t packet[4] = {0x6, data[0], 0xF7, 0};
        usb_midi.send(packet);
        D(Serial.print("Send packet: "));
        D(printBytesAsIntsArray(packet, 4));
        D(Serial.println(""));
        break;
      }
    case 0:
      { uint8_t packet[4] = {0x5, 0xF7, 0, 0};
        usb_midi.send(packet);
        D(Serial.print("Send packet: "));
        D(printBytesAsIntsArray(packet, 4));
        D(Serial.println(""));
        break;
      }

    default: break;
  }


}

boolean uMidi::sysexAvailable() {
  return recievedSysex;
}

byte * uMidi::returnSysex() {
  recievedSysex = false;
  return midiBuffer;
}
