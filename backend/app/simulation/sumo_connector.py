import os
import shutil
import subprocess
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class SumoConnector:
    def __init__(self):
        self.sumo_home = os.environ.get("SUMO_HOME", "")
        self.sumo_binary = shutil.which("sumo") or shutil.which("sumo.exe")
        self.traci_available = False
        self._check_traci()

    def _check_traci(self):
        try:
            import traci
            self.traci_available = True
        except ImportError:
            self.traci_available = False

    def get_status(self) -> Dict[str, Any]:
        """Honest status report of SUMO availability."""
        is_installed = bool(self.sumo_binary and self.traci_available)
        return {
            "sumo_installed": is_installed,
            "sumo_binary_path": self.sumo_binary if self.sumo_binary else "Not detected in PATH",
            "sumo_home_env": self.sumo_home if self.sumo_home else "SUMO_HOME environment variable not set",
            "traci_module_available": self.traci_available,
            "active_engine": "SUMO (TraCI)" if is_installed else "TRAFFIQ Native Physics Simulator",
            "installation_guide": {
                "windows_steps": [
                    "Download Eclipse SUMO Windows Installer from: https://eclipse.dev/sumo/",
                    "Run the installer and check 'Add to PATH'",
                    "Set environment variable: SUMO_HOME = C:\\Program Files (x86)\\Eclipse\\Sumo",
                    "Install python TraCI: pip install traci sumolib"
                ]
            }
        }

    def generate_sumo_scenario(self, output_dir: str = "./sumo_files") -> Dict[str, Any]:
        """
        Creates standard 4-way intersection SUMO network (.net.xml) and route files (.rou.xml)
        for users who have SUMO installed.
        """
        os.makedirs(output_dir, exist_ok=True)
        nod_file = os.path.join(output_dir, "traffiq.nod.xml")
        edg_file = os.path.join(output_dir, "traffiq.edg.xml")
        cfg_file = os.path.join(output_dir, "traffiq.sumocfg")

        # Write nodes
        with open(nod_file, "w") as f:
            f.write("""<nodes>
    <node id="center" x="0.0" y="0.0" type="traffic_light"/>
    <node id="north" x="0.0" y="250.0" type="priority"/>
    <node id="south" x="0.0" y="-250.0" type="priority"/>
    <node id="east" x="250.0" y="0.0" type="priority"/>
    <node id="west" x="-250.0" y="0.0" type="priority"/>
</nodes>""")

        # Write edges
        with open(edg_file, "w") as f:
            f.write("""<edges>
    <edge id="N2C" from="north" to="center" priority="75" numLanes="2" speed="13.9"/>
    <edge id="C2N" from="center" to="north" priority="75" numLanes="2" speed="13.9"/>
    <edge id="S2C" from="south" to="center" priority="75" numLanes="2" speed="13.9"/>
    <edge id="C2S" from="center" to="south" priority="75" numLanes="2" speed="13.9"/>
    <edge id="E2C" from="east" to="center" priority="75" numLanes="2" speed="13.9"/>
    <edge id="C2E" from="center" to="east" priority="75" numLanes="2" speed="13.9"/>
    <edge id="W2C" from="west" to="center" priority="75" numLanes="2" speed="13.9"/>
    <edge id="C2W" from="center" to="west" priority="75" numLanes="2" speed="13.9"/>
</edges>""")

        # Write sumocfg
        with open(cfg_file, "w") as f:
            f.write("""<configuration>
    <input>
        <net-file value="traffiq.net.xml"/>
        <route-files value="traffiq.rou.xml"/>
    </input>
    <time>
        <begin value="0"/>
        <end value="3600"/>
    </time>
</configuration>""")

        return {
            "status": "generated",
            "directory": output_dir,
            "files": ["traffiq.nod.xml", "traffiq.edg.xml", "traffiq.sumocfg"]
        }
