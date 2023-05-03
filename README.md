## 8Mu Editor 

This is the temporary editor website for Music Thing Modular 8mu midi controller 

This repo contains  

* An optimised build of the website the editor, visible at https://tomwhitwell.github.io/Smith-Kakehashi/ 
* It also contains downloadable versions of the latest firmware in uf2 format https://github.com/TomWhitwell/Smith-Kakehashi/releases 



# 8mu
![image](https://user-images.githubusercontent.com/1890544/133736373-e85985e5-749e-4c13-ad75-23e05a69b056.png)
(NB: MUSICTHING.CO.UK/8MU does not exist yet) 



# Welcome to 8Mu 

8mu is a pocket-sized midi controller, slightly smaller than a credit card. 

8mu has eight faders that can send controller messages via Midi. 

Inside, it has an acellerometer to measure how the device is being held. This creates eight more control signals, mapped to gestures like "lift the front" or "turn me over" 

Along the back are four buttons, which can be configured to send Midi notes (like a keyboard) or controllers. 

8mu contains 8 banks of settings which can be switched using the left hand button. 

Behind the faders are 8 LEDs which indicate Midi being sent from that fader, and which bank is currently active. 

8mu is powered and sends data by USB-C. Only standard USB data lines are used, so it should work on any USB computer with an adaptor. 

8mu also has a 3.5mm hardware Midi output (Type B - Arturia, Polyend in the prototype. It will be software switchable)

Every setting in the 8mu can be configured in the [brower-based editor](https://tomwhitwell.github.io/Smith-Kakehashi/)

8mu cannot send i2c or CV. 

8mu was inspired by the 16n project. The hardware is quite different, but the editor is a modified version of the 16n editor by Tom Armitage.  

8mu is designed to be open and hackable. It can be re-programmed in Arduino or Circuit Python code, and makes a good platform for experimenting with algorithmic music generation. 

## In Use 
On first power up, the device writes default files - this takes a couple of seconds, while changing random LEDs are displayed on the screen 

## Initial settings
* At first, all 8 banks are identical
* 8 Faders, left to right (with USB cable on the right)
  * CC 32, 33, 34, 35, 36, 37, 38, 39 
* 8 Acellerometer gestures: 
  * Lift Front:   CC 40 
  * Lift Back:    CC 41
  * Lift Left:    CC 42
  * Lift Right:   CC 43 
  * Rotate CW:    CC 44
  * Rotate ACW:   CC 45
  * Not inverted: CC 46
  * Inverted:     CC 47 
* Leds blink on fader movements, not on Accelerometer movements 
* Midi Thru is on 
* The device is NOT flipped - so the USB cable is on the RIGHT 
* TRS Midi sends Mode B (Arturia)
* DX7 Mode (coming soon) is off   

## How to change banks 
* Tap the left or right buttons to move up and down through the banks 
* You'll see the bank LED move
* After a second, that bank will be selected and you'll see an LED confirmation animation 

## How to enter Midi Learn mode 
* Hold the RIGHT button. LEDS will flash: [\*][\*][\*][\*][ ][ ][ ][ ]
 * You are in Fader mode, acellerometer gestures are disables 
* Hold the RIGHT button again: LEDS will flash: [ ][ ][ ][ ][\*][\*][\*][\*]
 * You are in Gesture mode, the acellerometer gestures are mapped to the 8 faders 
* Hold the RIGHT button again to EXIT midi learn mode. 

### What's the point of Midi Learn mode?  
The accellerometer channels send a lot of data as the device moves. This makes it really annoying to use midi learn — It's hard to map a control to Fader 1 when the acellerometer is spitting out lots of subtle movement data. 

So, 8mu has two Midi Learn modes which temporarily turn off acellerometer outputs.  

* In the first, the accelerometer channels are simply turned off, so data from the faders is clean. 
* In the second, the faders are mapped to acellerometer channels, so they can be predictably controlled. 

So, to map filter cutoff to 'Lift Front', enter Midi Learn Mode 2, and move the first fader. Exit Midi Learn mode filter cutoff will be correctly mapped. 

### Midi Thru
When midi thru is on (by default) other midi signals can pass. If you have a computer sending notes and control messages, the 8mu controls will be added to those signals. 

## Banks 
* The device stores 8 independent banks of settings 
* By default, all banks are identical 
* Switch bank by tapping the L & R buttons. You'll see an indicator move left and right. After a second, the device will move to that bank - with a little LED animation. 
* The editor configures the current bank - it has no visibility of the other banks. 
* The current bank remains between power cycles. If you move to bank 4, then never change bank, the device will always be in bank 4. 
* To copy a bank, export the config in the editor, switch bank on the device, import the config. [Editor Export comings soon]  

## The Editor 
* The editor is here: https://tomwhitwell.github.io/Smith-Kakehashi/ 
* It connects to the device with Midi Sysex messages - when you plug it in, it takes a few seconds to handshake

## Startup uptions 
Hold down these buttons at power up:  
* A = Calibrate Accelerometer: Place on a firm horizontal surface before you start. Takes a second, LED animation on completion 
* ABCD = Restore defaults: Wipes all settings. 

## Firmware and file system 
* The device runs on stardard Arduino code. 
* Add `https://raw.githubusercontent.com/TomWhitwell/board-defs/master/package_musicthing_samd21_index.json` to "Additional Boards Manager Urls" in the Arduino IDE Preferences to install 'MusicThing M0 Plus'. 
* Firmware updates are supplied as UF2 files. To install a firmware upgrade, double click the TINY button next to the USB cable until a folder called MTM_BOOT appears on your desktop. Drop the UF2 file onto that folder. 
* To use Circuit Python, drag ///URL TO COME/// bootloader onto the folder 
* Otherwise you can use the Arduino IDE as normal 
* NB: The Arduino firmware relies on the Circuit Python filesystem to operate, so Circuit Python must have bewen installed and booted once before the firmware is installed. 

## How to...

NB: The Reset Button is the *tiny* recessed button beneath the first M of 'Music Thing Modular', not one of the bigger edge-mounted buttons. 

## Use the Arduino IDE with 8mu 
* In the Arduino IDE: Add `https://raw.githubusercontent.com/TomWhitwell/board-defs/master/package_musicthing_samd21_index.json` to "Additional Boards Manager Urls" in the Arduino IDE Preferences to install 'MusicThing M0 Plus'. 
* Go to 'Tools > Board > Boards Manager' and search for Music Thing. Install "Music Thing SAMD Boards" 
* Go to 'Tools > Board' and select 'Music Thing M0 Plus' 
* You should now be able to select the 8mu in your 'Tools > Port' list as something like /dev/cu/usbmodem14401 (on a Mac) and upload as normal.  

## Use Circuit Python with 8mu 
* Double click the reset button until MT_BOOT appears 
* Drop the MTM M0 Plus Circuit Python .uf2 bootloader into MT_BOOT
* The device will reboot and CIRCUITPY will appear on your desktop 
* You can now drop files into CIRCUITPY as normal ([Get started with Circuit Python](https://learn.adafruit.com/welcome-to-circuitpython))

## Reinstall stock firmware 
* Double click the reset button until MT_BOOT appears  
* Drop the latest firmware file (for example 8mu_0_1_2.uf2 ) onto MT_BOOT 

## Hard reset settings 
* If you have problems (mysterious dead faders), the ABCD on startup doesn't seem to fully reset the system 
* In this case: 
 * Double click the reset button until MT_BOOT appears 
 * Drop the MTM M0 Plus Circuit Python .uf2 bootloader into MT_BOOT
 * When the CIRCUITPY folder appears, delete BANK.cfg and EEPROM.cfg. 
 * Important: Empty the recycle bin. 
 * Double click the reset button until MT_BOOT appears again 
 * Drop the latest firmware file (for example 8mu_0_1_2.uf2 ) onto MT_BOOT 

## Install full firmware stack 
* FIRST Using Jlink Segger, install Music Thing M0 Plus firmware onto SAMD chip
* [SAMD Bootloader instructions and code here](https://github.com/TomWhitwell/8mu/tree/main/Bootloaders/SAMD%20Bootloader%20for%208mu/Music%20Thing%20M0%20Plus) 
* SECOND Drop the Circuit Python bootloader into the MT_BOOT folder on the desktop to install the filesystem 
* [Circuit Python bootloader .uf2 here](https://github.com/TomWhitwell/8mu/tree/main/Bootloaders/Circuit%20Python%20for%208mu)
* THIRD Double click the reset button until MT_BOOT reappears, and drop the 8mu Firmware into the folder 
* [8mu compiled firmware .uf2 over in the Smith-Kakehashi repo](https://github.com/TomWhitwell/Smith-Kakehashi/releases)

## Turn arduino code into .uf2 
* Use https://github.com/microsoft/uf2/tree/master/utils uf2conv.py
* Find build folder Arduino IDE compilation log - for example `/var/folders/sv/l7cxqy2s3zj0mpdb5j38pr0m0000gn/T/arduino_build_39740/` 
* [Details on this page](https://learn.adafruit.com/adafruit-feather-m0-express-designed-for-circuit-python-circuitpython/uf2-bootloader-details)
* [How to use uf2conv.py](https://github.com/microsoft/uf2/blob/master/utils/uf2conv.md)
* Use command like: `python uf2conv.py 8mu.ino.bin -c -o 8mu_0_1_2.uf2` 

## Release update to public website 
* Run `npm run build` in `8mu Editor` folder 
* Copy contents of `public` into `docs` in the repo facing github.io  
