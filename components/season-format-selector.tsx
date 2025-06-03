"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface SeasonFormatOption {
  id: string
  name: string
  description: string
}

interface SeasonFormatSelectorProps {
  selectedFormat: string
  onFormatChange: (formatId: string) => void
}

export const seasonFormatOptions: SeasonFormatOption[] = [
  {
    id: "regular",
    name: "Regular Format",
    description: "Bottom two queens lipsync for their life. The loser sashays away."
  },
  {
    id: "legacy",
    name: "Lipsync for Your Legacy",
    description: "Top two queens lipsync for the win, and the winner decides who to eliminate from the bottom."
  }
]

export function SeasonFormatSelector({ selectedFormat, onFormatChange }: SeasonFormatSelectorProps) {
  // Find the selected format option for displaying in the trigger
  const selectedFormatOption = seasonFormatOptions.find(format => format.id === selectedFormat);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season Format</CardTitle>
        <CardDescription>Choose how eliminations will be determined in this season</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedFormat} onValueChange={onFormatChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {selectedFormatOption ? selectedFormatOption.name : "Select format"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {seasonFormatOptions.map((format) => (
              <SelectItem 
                key={format.id} 
                value={format.id}
              >
                {format.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Show description of selected format below the dropdown */}
        {selectedFormatOption && (
          <p className="text-sm text-muted-foreground mt-2">
            {selectedFormatOption.description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
