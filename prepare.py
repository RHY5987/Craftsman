import aiofiles
import aiohttp
import asyncio
import os
import sys
import subprocess
import ctypes

welcome = "Welcome to the Craftsman Installer!\nThis program will help you get setup with Craftsman quickly by downloading the necessary files.\nIt also adds a registry key that allows Craftsman Helper to communicate with Craftsman.\n\nPlease allow any User Account Control prompts that appear, so that the installer can register what it needs!\n"
ctypes.windll.kernel32.SetConsoleTitleW("Craftsman Installer")

# Fix for Windows specific loop error (see https://github.com/encode/httpx/issues/914#issuecomment-622586610)
if sys.version_info[0] == 3 and sys.version_info[1] >= 8 and sys.platform.startswith('win'):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

cwd = os.getcwd()

# Make folders to store stuff in
async def make_folders():
    if not os.path.exists(os.path.join(cwd, 'steamcmd')):
        os.mkdir('steamcmd')

# Download a file from URL locally
async def download_file(url, path):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            async with aiofiles.open(path, 'wb') as f:
                while True:
                    chunk = await response.content.read(1024)
                    if not chunk:
                        break
                    await f.write(chunk)

# Register Craftsman with Windows
async def register_steamcmd():
    # Read text file, replace the keyword PATHTOCraftsman
    async with aiofiles.open(os.path.join(cwd, 'protocolTemplate.reg'), 'r', encoding='utf-16-le') as f:
        template = await f.read()
    template = template.replace('PATHTOCraftsmanHERE', cwd.replace('\\', '\\\\'))
    
    tempFile = os.path.join(cwd, 'tempHandler.reg')
    async with aiofiles.open(tempFile, 'w', encoding='utf-16-le') as f:
        await f.write(template)

    reg = os.path.join(os.environ['WINDIR'],'System32\\reg.exe')
    result = subprocess.run(f'"{reg}" import "{tempFile}"', shell=True, capture_output=True)
    output = result.stderr.decode('utf-8')
    if "The operation completed successfully." in output:
        print("Successfully registered Craftsman!")
        os.remove(tempFile)
        return(True)
    else:
        print("Failed to register Craftsman!")
        print(output)
        os.remove(tempFile)
        return(False)

async def failure():
    print('Something went wrong during installation.')
    ctypes.windll.user32.MessageBoxW(0, "Craftsman has failed to install!\nFor detailed install info, check the console.\n\nClick OK to close.", "Craftsman Installer", 0)
    sys.exit(1)

async def main():
    print(welcome)
    input("Press Enter to continue, or close this window to cancel...")

    await make_folders()

    print('Downloading steamcmd-2fa...')
    await download_file('https://github.com/Weilbyte/steamcmd-2fa/releases/latest/download/steamcmd-2fa.exe', os.path.join(cwd, 'steamcmd\\steamcmd-2fa.exe'))

    print('Downloading steamcmd')
    await download_file('https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip', os.path.join(cwd, 'steamcmd\\steamcmd.zip'))

    print('Registering Craftsman...')
    if await register_steamcmd() != True:
        await failure()
    print('All done!')
    ctypes.windll.user32.MessageBoxW(0, "Craftsman has been successfully installed!\nTo uninstall, download and run the uninstaller from GitHub.\n\nClick OK to close.", "Craftsman Installer", 0)

asyncio.run(main())