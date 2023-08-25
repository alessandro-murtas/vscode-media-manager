# Media manager

This extension lets you control every media player (Spotify, WMP, MediaMonkey...) and show media info on your status bar

![Alt text](https://github.com/trimone9000/vscode-media-manager/raw/master/assets/preview.png "Extension preview")

### Table of Contents
1. [Introduction](#introduction)
2. [Install](#install)
3. [Setup](#setup)
4. [Why should i use Media manager?](#why-should-i-use-media-manager?)
5. [Media players that support media info](#media-players-that-support-media-info)

### Introduction

This extension gives you control over the playback of whichever media is playing right now (play, pause, skip and previous) like:
* Spotify music (Spotify premium is NOT required)
* Youtube video
* VLC music or video
* Every other media player

### Install

To install this extension look for ```mediaManager``` on Visual Studio Code marketplace and click on the install button or launch this command on visual studio code command palette:
```sh
ext install mediaManager
```
### Setup

After you have installed this extension no further setup is required

### Why should i use Media manager?

There are multiple reason for which you should use Media manager over other available extensions:
* No setup is required in order to use this extension: as soon as you install it via the marketplace you can use it
* It supports every media player available on Windows, even Spotify without premium subscription unlike all the other extensions
* On some supported media players, media info (Song, Artist, Album) is displayed in the status bar (see [Media players that support media info](#media-players-that-support-media-info))


### Media players that support media info

Even though all media players are supported to control the playback, not all the media players provide to the OS the necessary infos about the media being played, and therefore only when using one of the following media players, media info will be displayed on the status bar:
* Spotify
* Windows media player (not the legacy version, and doesn't always display the infos)
* Mediamonkey
* Foobar2000 (Doesn't display album title)
* Youtube
* Others media players that I haven't tested may display media info and if you find other players that work feel free to send me an email at alessandro.murtas04@gmail.com so that i can update the list