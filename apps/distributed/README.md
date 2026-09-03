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

in /etc/systemd/user

[Unit]
Description=Flux Release App
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/flux-release/apps/distributed
ExecStart=/home/pi/.nvm/versions/node/v24.20.0/bin/node /home/pi/flux-release/apps/distributed/.build/server.js
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target

sudo chmod +x FluxRelease.service
sudo systemctl daemon-reload
sudo systemctl enable FluxRelease.service
sudo systemctl start FluxRelease.service

4. chromium on boot

in ~/.config/autostart

[Desktop Entry]
Name=Chromium
Comment=Starts after desktop login
Type=Application
Exec=chromium --kiosk --password-store=basic --start-fullscreen http://localhost:8000
Terminal=false



