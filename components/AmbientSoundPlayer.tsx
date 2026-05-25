"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, CloudRain, Coffee, Music, Play, Pause } from "lucide-react";

interface SoundTrack {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
}

const tracks: SoundTrack[] = [
  { id: "rain", name: "Lluvia (Misterio)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", icon: <CloudRain className="w-4 h-4" /> }, // Placeholder URLs
  { id: "cafe", name: "Cafetería (Romance)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", icon: <Coffee className="w-4 h-4" /> },
  { id: "epic", name: "Épico (Fantasía)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", icon: <Music className="w-4 h-4" /> },
];

export default function AmbientSoundPlayer() {
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeTrack) {
      const track = tracks.find(t => t.id === activeTrack);
      if (track) {
        if (!audioRef.current) {
          audioRef.current = new Audio(track.url);
          audioRef.current.loop = true;
        } else {
          audioRef.current.src = track.url;
        }
        
        if (isPlaying) {
          audioRef.current.play().catch(e => console.error("Error playing audio", e));
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [activeTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing audio", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
        <Volume2 className="w-4 h-4" /> Sonido de Ambiente
      </h4>
      <div className="grid grid-cols-1 gap-2">
        {tracks.map(track => (
          <button
            key={track.id}
            onClick={() => {
              if (activeTrack === track.id) {
                setIsPlaying(!isPlaying);
              } else {
                setActiveTrack(track.id);
                setIsPlaying(true);
              }
            }}
            className={`flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
              activeTrack === track.id ? "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {track.icon}
              <span>{track.name}</span>
            </div>
            {activeTrack === track.id && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        ))}
      </div>
      
      {activeTrack && (
        <div className="mt-2 flex items-center gap-2">
          <VolumeX className="w-4 h-4 text-gray-500" />
          <input 
            type="range" 
            min="0" max="1" step="0.1"
            value={volume} 
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 accent-primary h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <Volume2 className="w-4 h-4 text-gray-500" />
        </div>
      )}
    </div>
  );
}
