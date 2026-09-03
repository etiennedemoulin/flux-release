# distributed system

1. Raspberry Pi 4B + Waveshare screen for GUI and serveur
2. MacMini M1 + Scarlett 4i4 for sound

## Raspberry configuration

1. Screen
https://www.waveshare.com/wiki/4inch_HDMI_LCD

	a. overlay
download https://files.waveshare.com/wiki/10.1inch%20HDMI%20LCD/waveshare-ads7846.dtbo
add to /boot/overlays 

	b. update config
on boot/firmware/config.txt

dtparam=audio=off
dtoverlay=vc4-kms-v3d,noaudio

hdmi_group=2
hdmi_mode=87
hdmi_timings=480 0 40 10 80 800 0 13 3 32 0 0 0 60 0 32000000 3
hdmi_drive=1
hdmi_force_hotplug=1
dtoverlay=waveshare-ads7846,penirq=25,xmin=312,xmax=3609,ymin=214,ymax=3510,speed=50000

use evtest to set x,y

2. wifi 
sudo nmtui

3. install node
https://nodejs.org/en/download 
app https://github.com/etiennedemoulin/flux-release
npm install
npm run build

4. soundworks serveur

copy FluxRelease.service in /etc/systemd/system

sudo chmod +x FluxRelease.service
sudo systemctl daemon-reload
sudo systemctl enable FluxRelease.service
sudo systemctl start FluxRelease.service

4. chromium on boot

copy Chromium.desktop in ~/.config/autostart

5. remove cursor

I simply added a nocursor option as follows in the file (/etc/lightdm/lightdm.conf)

xserver-command = X -nocursor


## MacOS Config

1. bootscript is located at com.collectifvelcro.fluxreleaseclient.plist
copy to ~/Library/LaunchAgents
load with launchctl load -w ~/Library/LaunchAgents/com.collectifvelcro.fluxreleaseclient.plist

2. autostart/stop
sudo pmset repeat poweron MTWRFSU 9:00:00 shutdown MTWRFSU 18:00:00
