# Built using vscode-ext

import sys
from enum import Enum

import win32api

import vscode
from vscode import *

import asyncio

from winsdk.windows.media.control import \
    GlobalSystemMediaTransportControlsSessionManager as MediaManager

ext = vscode.Extension(name="mediaManager", display_name="Media manager", version="1.0.0")

class Status(Enum):
    CLOSED = 0
    OPENED = 1
    CHANGING = 2
    STOPPED = 3
    PLAYING = 4
    PAUSED = 5


async def get_status():
    await asyncio.sleep(.1)
    sessions = await MediaManager.request_async()

    current_session = sessions.get_current_session()

    if current_session:
        stat = current_session.get_playback_info().playback_status
    else:
        return f"Media manager not found!"

    match stat:
        case Status.PLAYING.value:
            data = await get_media_info()
            return f"{data['title']} ☼ {data['artist']} ☼ {data['album_title']} ☼ PLAYING"
        case Status.PAUSED.value:
            data = await get_media_info()
            return f"{data['title']} ☼ {data['artist']} ☼ {data['album_title']} ☼ PAUSED"
        case _:
            return f"Nothing playing"


async def stop_playback():
    sessions = await MediaManager.request_async()

    current_session = sessions.get_current_session()

    await current_session.try_toggle_play_pause_async()


async def next_song():
    sessions = await MediaManager.request_async()

    current_session = sessions.get_current_session()

    await current_session.try_skip_next_async()


async def previous_song():
    sessions = await MediaManager.request_async()

    current_session = sessions.get_current_session()

    await current_session.try_skip_previous_async()


async def get_media_info():
    sessions = await MediaManager.request_async()

    # This source_app_user_model_id check and if statement is optional
    # Use it if you want to only get a certain player/program's media
    # (e.g. only chrome.exe's media not any other program's).

    # To get the ID, use a breakpoint() to run sessions.get_current_session()
    # while the media you want to get is playing.
    # Then set TARGET_ID to the string this call returns.

    current_session = sessions.get_current_session()

    if current_session:  # there needs to be a media session running
        info = await current_session.try_get_media_properties_async()

        # song_attr[0] != '_' ignores system attributes
        info_dict = {song_attr: info.__getattribute__(song_attr) for song_attr in dir(info) if song_attr[0] != '_'}

        # converts winrt vector to list
        info_dict['genres'] = list(info_dict['genres'])

        return info_dict

    # It could be possible to select a program from a list of current
    # available ones. I just haven't implemented this here for my use case.
    # See references for more information.
    # raise Exception('TARGET_PROGRAM is not the current media session')


@ext.event
def on_activate():
    return f"The Extension '{ext.name}' has started"


@ext.command()
def pause():
    win32api.keybd_event(0xb3, 34)
    vscode.window.show_info_message(f"{asyncio.run(get_status())}")


@ext.command()
def previous_media():
    win32api.keybd_event(0xb1, 34)
    vscode.window.show_info_message(f"{asyncio.run(get_status())}")


@ext.command()
def next_media():
    win32api.keybd_event(0xb0, 34)
    vscode.window.show_info_message(f"{asyncio.run(get_status())}")


@ext.command()
def get_info():
    vscode.window.show_info_message(f"{asyncio.run(get_status())}")


def ipc_main():
    globals()[sys.argv[1]]()

ipc_main()
