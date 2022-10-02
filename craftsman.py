import sys
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()

# if os.getenv['']
dir = ""

fullUrl = sys.argv[1]
wsIDs = "".join(fullUrl.split("://")[1:])
wsIDs = wsIDs.replace("%20", " ")
wsIDs = wsIDs.replace("/", "")
path = os.path.join(dir, "SteamCMD\\steamcmd.exe")
parsed_cmd = f'"{path}" +login anonymous +workshop_download_item {wsIDs} +quit'
subprocess.run(parsed_cmd, shell=True)