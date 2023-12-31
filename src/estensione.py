from enum import Enum

import vscode
from vscode import *

import asyncio

from winsdk.windows.media.control import \
    GlobalSystemMediaTransportControlsSessionManager as MediaManager

ext = vscode.Extension(name="mediaManager", display_name="Media manager", version="0.0.1")


class Status(Enum):
    CLOSED = 0
    OPENED = 1
    CHANGING = 2
    STOPPED = 3
    PLAYING = 4
    PAUSED = 5


class PlaybackType(Enum):
    UNKNOWN = 0
    MUSIC = 1
    VIDEO = 2
    IMAGE = 3
    

async def get_status():
    await asyncio.sleep(.1)
    sessions = await MediaManager.request_async()

    current_session = sessions.get_current_session()

    stat = current_session.get_playback_info().playback_status

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

    # If there are multiple sessions the session playing music is preferred over the others
    if current_session.get_playback_info().playback_type != PlaybackType.MUSIC.value:
        current_sessions = sessions.get_sessions()

        for session in current_sessions:
            if session.get_playback_info().playback_type == PlaybackType.MUSIC.value:
                current_session = current_sessions
                break

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
    return asyncio.run(get_status())


@ext.command()
def pause():
    asyncio.run(stop_playback())
    vscode.window.show_info_message(f"{asyncio.run(get_status())}")


@ext.command()
def previous_media():
    asyncio.run(previous_song())
    vscode.window.show_info_message(f"{asyncio.run(get_status())}")


@ext.command()
def next_media():
    asyncio.run(next_song())
    vscode.window.show_info_message(f"{asyncio.run(get_status())}")


@ext.command()
def get_info():
    vscode.window.show_info_message(f"{asyncio.run(get_status())}")


vscode.build(ext)
