// components/mitre-sparta-defense.tsx
"use client";

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon, ShieldIcon } from "lucide-react";
import { MITREMapper, MITRETechnique } from "@/lib/mitre-mapping";

interface MitreDefenseProps {
  defensiveCapabilities: {
    maneuverability: boolean;
    commsJamming: boolean;
    sensorBlinding: boolean;
  };
}

interface DefenseMapping {
  capability: string;
  available: boolean;
  mitreTechniques: MITRETechnique[];
  spartaIds: string[];
  description: string;
}

const MitreSpartaDefense = ({ defensiveCapabilities }: MitreDefenseProps) => {
  const [mappings, setMappings] = useState<DefenseMapping[]>([]);

  useEffect(() => {
    // Create mappings between defensive capabilities and MITRE/SPARTA techniques
    const defenseMap: DefenseMapping[] = [
      {
        capability: "Onboard Maneuverability",
        available: defensiveCapabilities.maneuverability,
        mitreTechniques: MITREMapper.getTechniquesByTactic("Impact").filter(t => 
          t.description.includes("orbital") || t.name.includes("Denial of Service")),
        spartaIds: ["T001", "T005"],
        description: "Ability to perform orbital maneuvers to avoid collisions or threats"
      },
      {
        capability: "Communications Jamming",
        available: defensiveCapabilities.commsJamming,
        mitreTechniques: MITREMapper.getTechniquesByTactic("Impact").filter(t => 
          t.description.includes("communication") || t.name.includes("Denial of Service")),
        spartaIds: ["T004", "T008"],
        description: "Resistance to communication interference and signal jamming"
      },
      {
        capability: "Optical Sensor Blinding",
        available: defensiveCapabilities.sensorBlinding,
        mitreTechniques: MITREMapper.getTechniquesByTactic("Impact").filter(t => 
          t.description.includes("sensor") || t.name.includes("Data Manipulation")),
        spartaIds: ["T003", "T007"],
        description: "Protection against optical sensor interference or blinding attacks"
      }
    ];

    setMappings(defenseMap);
  }, [defensiveCapabilities]);

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-300">Defensive Capabilities</h4>
      
      {mappings.map((mapping, index) => (
        <div key={index} className="bg-slate-800/40 p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">{mapping.capability}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{mapping.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant={mapping.available ? "default" : "destructive"}>
              {mapping.available ? "Available" : "Unavailable"}
            </Badge>
          </div>
          
          <div className="pt-2 border-t border-slate-700">
            <div className="flex flex-wrap gap-1 mb-1">
              <span className="text-xs text-slate-400">MITRE:</span>
              {mapping.mitreTechniques.slice(0, 2).map((technique) => (
                <Badge key={technique.id} variant="outline" className="text-xs">
                  {technique.id}: {technique.name}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-slate-400">SPARTA:</span>
              {mapping.spartaIds.map((id) => (
                <Badge key={id} variant="outline" className="text-xs bg-slate-700">
                  {id}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ))}
      
      <div className="bg-slate-800/40 p-3 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <ShieldIcon className="h-4 w-4 text-cyan-400" />
          <span>Defense Posture Assessment</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Current defensive capabilities provide protection against {mappings.filter(m => m.available).length} of {mappings.length} potential threat vectors identified in the MITRE ATT&CK and SPARTA frameworks for space systems.
        </p>
      </div>
    </div>
  );
};

export default MitreSpartaDefense;