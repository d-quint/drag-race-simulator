"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Trash2, Plus, Edit, Shuffle, Download, Upload, Save, FolderOpen } from "lucide-react"
import type { Queen } from "@/lib/types"
import React from "react"

interface QueenCreatorProps {
  queens: Queen[]
  setQueens: (queens: Queen[]) => void
}

export function QueenCreator({ queens, setQueens }: QueenCreatorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savedCasts, setSavedCasts] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<Omit<Queen, "id">>({
    name: "",
    imageUrl: "",
    congeniality: 5,
    loyalty: 5,
    novelty: 5,
    conceptualDepth: 5,
    riskTolerance: 5,
    conflictResilience: 5,
    designVision: 5,
    comedyChops: 5,
    lipSyncProwess: 5,
    runwayPresence: 5,
    actingAbility: 5,
    vocalMusicality: 5,
    versatility: 5,
    adaptability: 5,
    starPower: 5,
  })

  // Load saved casts on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem("dragRaceCasts")
    if (saved) {
      setSavedCasts(Object.keys(JSON.parse(saved)))
    }
  }, [])

  const resetForm = () => {
    setFormData({
      name: "",
      imageUrl: "",
      congeniality: 5,
      loyalty: 5,
      novelty: 5,
      conceptualDepth: 5,
      riskTolerance: 5,
      conflictResilience: 5,
      designVision: 5,
      comedyChops: 5,
      lipSyncProwess: 5,
      runwayPresence: 5,
      actingAbility: 5,
      vocalMusicality: 5,
      versatility: 5,
      adaptability: 5,
      starPower: 5,
    })
    setIsCreating(false)
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (editingId) {
      setQueens(queens.map((queen) => (queen.id === editingId ? { ...formData, id: editingId } : queen)))
    } else {
      const newQueen: Queen = {
        ...formData,
        id: Date.now().toString(),
      }
      setQueens([...queens, newQueen])
    }
    resetForm()
  }

  const handleEdit = (queen: Queen) => {
    setFormData(queen)
    setEditingId(queen.id)
    setIsCreating(true)
  }

  const handleDelete = (id: string) => {
    setQueens(queens.filter((queen) => queen.id !== id))
  }

  const StatSlider = ({
    label,
    value,
    onChange,
    description,
  }: {
    label: string
    value: number
    onChange: (value: number) => void
    description: string
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm text-gray-500">{value}/10</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        max={10}
        min={1}
        step={1}
        className="w-full"
      />
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  )

  const generateRandomQueen = () => {
    const randomStats = () => Math.floor(Math.random() * 10) + 1
    const queenNames = [
      "Mystique Allure",
      "Velvet Storm",
      "Crystal Divine",
      "Sasha Glamour",
      "Bianca Fierce",
      "Trixie Sparkle",
      "Katya Wild",
      "Aquaria Flow",
      "Jinkx Magic",
      "Raja Elegance",
      "Sharon Needles",
      "Chad Michaels",
      "Raven Darkness",
      "Manila Luzon",
      "Latrice Royale",
      "Willam Belli",
    ]

    const randomName =
      queenNames[Math.floor(Math.random() * queenNames.length)] + ` ${Math.floor(Math.random() * 999) + 1}`

    const newQueen: Queen = {
      id: Date.now().toString(),
      name: randomName,
      imageUrl: `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(randomName)}`,
      congeniality: randomStats(),
      loyalty: randomStats(),
      novelty: randomStats(),
      conceptualDepth: randomStats(),
      riskTolerance: randomStats(),
      conflictResilience: randomStats(),
      designVision: randomStats(),
      comedyChops: randomStats(),
      lipSyncProwess: randomStats(),
      runwayPresence: randomStats(),
      actingAbility: randomStats(),
      vocalMusicality: randomStats(),
      versatility: randomStats(),
      adaptability: randomStats(),
      starPower: randomStats(),
    }

    setQueens([...queens, newQueen])
  }

  // Export current queens to JSON file
  const exportQueens = () => {
    const dataStr = JSON.stringify(queens, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `drag-race-cast-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Import queens from JSON file
  const importQueens = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedQueens = JSON.parse(e.target?.result as string) as Queen[]

        // Validate the imported data
        if (
          Array.isArray(importedQueens) &&
          importedQueens.every((queen) => queen.name && typeof queen.congeniality === "number")
        ) {
          // Generate new IDs to avoid conflicts
          const queensWithNewIds = importedQueens.map((queen) => ({
            ...queen,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          }))

          setQueens([...queens, ...queensWithNewIds])
        } else {
          alert("Invalid file format. Please select a valid drag race cast JSON file.")
        }
      } catch (error) {
        alert("Error reading file. Please make sure it's a valid JSON file.")
      }
    }
    reader.readAsText(file)

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Save current cast with a name
  const saveCast = () => {
    const castName = prompt("Enter a name for this cast:")
    if (!castName || !castName.trim()) return

    const savedCasts = JSON.parse(localStorage.getItem("dragRaceCasts") || "{}")
    savedCasts[castName.trim()] = queens
    localStorage.setItem("dragRaceCasts", JSON.stringify(savedCasts))

    setSavedCasts(Object.keys(savedCasts))
    alert(`Cast "${castName}" saved successfully!`)
  }

  // Load a saved cast
  const loadCast = (castName: string) => {
    const savedCasts = JSON.parse(localStorage.getItem("dragRaceCasts") || "{}")
    const cast = savedCasts[castName]

    if (cast) {
      const confirmLoad = confirm(`Load "${castName}"? This will replace your current queens.`)
      if (confirmLoad) {
        setQueens(cast)
      }
    }
  }

  // Delete a saved cast
  const deleteCast = (castName: string) => {
    const confirmDelete = confirm(`Delete saved cast "${castName}"?`)
    if (confirmDelete) {
      const savedCasts = JSON.parse(localStorage.getItem("dragRaceCasts") || "{}")
      delete savedCasts[castName]
      localStorage.setItem("dragRaceCasts", JSON.stringify(savedCasts))
      setSavedCasts(Object.keys(savedCasts))
    }
  }

  return (
    <div className="space-y-6">
      {!isCreating && (
        <div className="space-y-4">
          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button onClick={() => setIsCreating(true)} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Create New Queen
            </Button>
            <Button onClick={generateRandomQueen} variant="outline" className="flex-1">
              <Shuffle className="w-4 h-4 mr-2" />
              Generate Random Queen
            </Button>
          </div>

          {/* Import/Export and Save/Load Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={exportQueens} variant="outline" size="sm" disabled={queens.length === 0}>
              <Download className="w-4 h-4 mr-1" />
              Export Cast
            </Button>

            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-1" />
              Import Cast
            </Button>

            <Button onClick={saveCast} variant="outline" size="sm" disabled={queens.length === 0}>
              <Save className="w-4 h-4 mr-1" />
              Save Cast
            </Button>

            <Button
              onClick={() => {
                if (savedCasts.length === 0) {
                  alert("No saved casts found.")
                  return
                }
                const castName = prompt(`Choose a cast to load:\n${savedCasts.join("\n")}`)
                if (castName && savedCasts.includes(castName)) {
                  loadCast(castName)
                }
              }}
              variant="outline"
              size="sm"
              disabled={savedCasts.length === 0}
            >
              <FolderOpen className="w-4 h-4 mr-1" />
              Load Cast
            </Button>
          </div>

          {/* Saved Casts Display */}
          {savedCasts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saved Casts</CardTitle>
                <CardDescription>Your saved queen collections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {savedCasts.map((castName) => (
                    <div key={castName} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1 text-sm font-medium">{castName}</span>
                      <Button size="sm" variant="outline" onClick={() => loadCast(castName)}>
                        Load
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCast(castName)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" accept=".json" onChange={importQueens} style={{ display: "none" }} />
        </div>
      )}

      {isCreating && (
        <Card className="border-2 border-pink-200">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Queen" : "Create New Queen"}</CardTitle>
            <CardDescription>Set stats from 1-10 for each category</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Queen Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter queen name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Enter image URL or leave blank for placeholder"
                  />
                </div>
              </div>

              {/* Image Preview */}
              {formData.imageUrl && (
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={formData.imageUrl || "/placeholder.svg"}
                      alt={formData.name || "Queen preview"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `/placeholder.svg?height=128&width=128&text=${encodeURIComponent(
                          formData.name || "Queen",
                        )}`
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Charisma */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-pink-600">CHARISMA</h3>
                  <StatSlider
                    label="Congeniality Level"
                    value={formData.congeniality}
                    onChange={(value) => setFormData({ ...formData, congeniality: value })}
                    description="1 = Villainous, manipulative; 10 = Sisterly, empathetic"
                  />
                  <StatSlider
                    label="Loyalty Level"
                    value={formData.loyalty}
                    onChange={(value) => setFormData({ ...formData, loyalty: value })}
                    description="1 = Betrays alliances easily; 10 = Fiercely protects allies"
                  />
                </div>

                {/* Uniqueness */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-purple-600">UNIQUENESS</h3>
                  <StatSlider
                    label="Novelty Level"
                    value={formData.novelty}
                    onChange={(value) => setFormData({ ...formData, novelty: value })}
                    description="1 = Basic/conventional drag; 10 = Revolutionary, instantly iconic"
                  />
                  <StatSlider
                    label="Conceptual Depth"
                    value={formData.conceptualDepth}
                    onChange={(value) => setFormData({ ...formData, conceptualDepth: value })}
                    description="1 = Surface-level aesthetics; 10 = Thematically rich, thought-provoking"
                  />
                </div>

                {/* Nerve */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-indigo-600">NERVE</h3>
                  <StatSlider
                    label="Risk Tolerance"
                    value={formData.riskTolerance}
                    onChange={(value) => setFormData({ ...formData, riskTolerance: value })}
                    description="1 = Plays it safe; 10 = Takes bold creative/strategic risks"
                  />
                  <StatSlider
                    label="Conflict Resilience"
                    value={formData.conflictResilience}
                    onChange={(value) => setFormData({ ...formData, conflictResilience: value })}
                    description="1 = Crumbles under pressure; 10 = Thrives in drama, unfazed by critiques"
                  />
                </div>

                {/* Talent */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-emerald-600">TALENT</h3>
                  <StatSlider
                    label="Design Vision"
                    value={formData.designVision}
                    onChange={(value) => setFormData({ ...formData, designVision: value })}
                    description="Sewing/construction, materials innovation, cohesive aesthetic"
                  />
                  <StatSlider
                    label="Comedy Chops"
                    value={formData.comedyChops}
                    onChange={(value) => setFormData({ ...formData, comedyChops: value })}
                    description="Timing, wit, improv, roast challenges, Snatch Game"
                  />
                  <StatSlider
                    label="Lip Sync Prowess"
                    value={formData.lipSyncProwess}
                    onChange={(value) => setFormData({ ...formData, lipSyncProwess: value })}
                    description="Emotional delivery, stunts, precision, crowd control"
                  />
                  <StatSlider
                    label="Runway Presence"
                    value={formData.runwayPresence}
                    onChange={(value) => setFormData({ ...formData, runwayPresence: value })}
                    description="Modeling, character embodiment, garment impact"
                  />
                  <StatSlider
                    label="Acting Ability"
                    value={formData.actingAbility}
                    onChange={(value) => setFormData({ ...formData, actingAbility: value })}
                    description="Scripted challenges, versatility, emotional range"
                  />
                  <StatSlider
                    label="Vocal/Musicality"
                    value={formData.vocalMusicality}
                    onChange={(value) => setFormData({ ...formData, vocalMusicality: value })}
                    description="Rusical challenges, singing, rap, live vocals"
                  />
                </div>

                {/* Additional Traits */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-amber-600">ADDITIONAL TRAITS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatSlider
                      label="Versatility"
                      value={formData.versatility}
                      onChange={(value) => setFormData({ ...formData, versatility: value })}
                      description="Ability to excel across different challenge types"
                    />
                    <StatSlider
                      label="Adaptability"
                      value={formData.adaptability}
                      onChange={(value) => setFormData({ ...formData, adaptability: value })}
                      description="How quickly they pivot after failure/critique"
                    />
                    <StatSlider
                      label="Star Power"
                      value={formData.starPower}
                      onChange={(value) => setFormData({ ...formData, starPower: value })}
                      description="X-factor that makes them memorable beyond stats"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Update Queen" : "Create Queen"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Queens List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queens.map((queen) => (
          <Card key={queen.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                  <img
                    src={
                      queen.imageUrl ||
                      `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(queen.name.charAt(0)) || "/placeholder.svg"}`
                    }
                    alt={queen.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(
                        queen.name.charAt(0),
                      )}`
                    }}
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{queen.name}</CardTitle>
                  <CardDescription>
                    C: {((queen.congeniality + queen.loyalty) / 2).toFixed(1)} | U:{" "}
                    {((queen.novelty + queen.conceptualDepth) / 2).toFixed(1)} | N:{" "}
                    {((queen.riskTolerance + queen.conflictResilience) / 2).toFixed(1)} | T:{" "}
                    {(
                      (queen.designVision +
                        queen.comedyChops +
                        queen.lipSyncProwess +
                        queen.runwayPresence +
                        queen.actingAbility +
                        queen.vocalMusicality) /
                      6
                    ).toFixed(1)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(queen)} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(queen.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
