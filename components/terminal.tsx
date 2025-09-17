'use client';

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { projects } from '@/data/projects';
import { skills } from '@/data/skills';
import { about } from '@/data/about';
import { contact } from '@/data/contact';
import { education } from '@/data/education';
import {
  FaCode,
  FaUser,
  FaFolderOpen,
  FaLink,
  FaTerminal,
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaFacebook,
  FaWhatsapp,
  FaInstagram,
  FaTwitter,
  FaGraduationCap,
} from 'react-icons/fa';

type CommandType =
  | 'help'
  | 'about'
  | 'skills'
  | 'projects'
  | 'contact'
  | 'education'
  | 'clear'
  | 'version'
  | 'home'
  | 'unknown';

interface CommandHistory {
  command: string;
  output: React.ReactNode;
  isError?: boolean;
}

export function Terminal() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showWelcome, setShowWelcome] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [welcomeComplete, setWelcomeComplete] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Available commands for suggestions
  const availableCommands = [
    'help',
    'about',
    'skills',
    'projects',
    'contact',
    'education',
    'clear',
    'version',
    'home',
  ];

  // Initialize audio context on first user interaction
  const initializeAudio = useCallback(() => {
    if (!audioInitialized) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        setAudioInitialized(true);
      } catch (error) {
        console.log('Audio not supported');
      }
    }
  }, [audioInitialized]);

  // Enhanced sound effects for keyboard
  // Utility: play audio from file
  const playKeyboardSound = useCallback(
    (type: 'keypress' | 'backspace' | 'enter') => {
      let soundPath = '';

      switch (type) {
        case 'keypress':
          soundPath = '/key_press.wav';
          break;
        case 'backspace':
          soundPath = '/backspace_key.wav';
          break;
        case 'enter':
          soundPath = '/enter_key.wav';
          break;
      }

      if (soundPath) {
        const audio = new Audio(soundPath);
        audio.volume = 0.4; // adjust volume
        audio.currentTime = 0; // restart if triggered fast
        audio.play().catch(() => {});
      }
    },
    []
  );

  // Function to calculate string similarity (Levenshtein distance)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[len2][len1];
  };

  // Function to get command suggestions
  const getCommandSuggestions = (invalidCommand: string): string[] => {
    const suggestions = availableCommands
      .map((cmd) => ({
        command: cmd,
        distance: calculateSimilarity(
          invalidCommand.toLowerCase(),
          cmd.toLowerCase()
        ),
      }))
      .filter((item) => item.distance <= 3)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map((item) => item.command);

    return suggestions;
  };

  // Autocomplete function
  const getAutocompleteSuggestion = (currentInput: string): string => {
    if (!currentInput.trim()) return '';

    const matches = availableCommands.filter((cmd) =>
      cmd.toLowerCase().startsWith(currentInput.toLowerCase())
    );

    if (matches.length === 1) {
      return matches[0].slice(currentInput.length);
    }

    return '';
  };

  // Update suggestion when input changes
  useEffect(() => {
    setSuggestion(getAutocompleteSuggestion(input));
  }, [input]);

  // Always keep focus on input
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && welcomeComplete) {
        inputRef.current.focus();
      }
    };

    const handleClick = () => {
      initializeAudio();
      focusInput();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!audioInitialized) {
        initializeAudio();
      }
      // if (e.key === 'Enter') {
      //   playKeyboardSound('enter');
      // } else if (e.key === 'Backspace') {
      //   playKeyboardSound('backspace');
      // } else if (e.key.length === 1) {
      //   playKeyboardSound('keypress');
      // }
      focusInput();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    focusInput();

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [initializeAudio, welcomeComplete]);

  // Scroll to bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    initializeAudio();

    if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestion) {
        setInput(input + suggestion);
        setSuggestion('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Enter') {
      playKeyboardSound('enter');
    } else if (e.key === 'Backspace') {
      playKeyboardSound('backspace');
    } else if (e.key.length === 1) {
      playKeyboardSound('keypress');
    }
  };

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    const commandType = getCommandType(trimmedCmd);

    if (
      trimmedCmd &&
      (commandHistory.length === 0 ||
        commandHistory[commandHistory.length - 1] !== trimmedCmd)
    ) {
      setCommandHistory((prev) => [...prev, trimmedCmd]);
    }
    setHistoryIndex(-1);

    let output: React.ReactNode;
    let isError = false;

    switch (commandType) {
      case 'help':
        output = renderHelp();
        break;
      case 'about':
        output = renderAbout();
        break;
      case 'skills':
        output = renderSkills();
        break;
      case 'contact':
        output = renderContact();
        break;
      case 'education':
        output = renderEducation();
        break;
      case 'clear':
      case 'home':
        setHistory([]);
        setShowWelcome(true);
        setWelcomeComplete(false);
        return;
      case 'version':
        output = (
          <div className='flex items-center space-x-2'>
            <FaTerminal className='text-green-400' />
            <span className='text-green-400 font-bold'>Minhaj CLI v2.0.0</span>
            <span className='text-gray-400'>
              - Modern Interactive Portfolio
            </span>
          </div>
        );
        break;
      default:
        const suggestions = getCommandSuggestions(trimmedCmd);
        output = (
          <div className='bg-red-900/20 border border-red-500/30 rounded-lg p-4'>
            <div className='text-red-400 font-bold mb-2'>
              ❌ Command not found: {cmd}
            </div>
            {suggestions.length > 0 && (
              <div className='mt-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3'>
                <div className='text-yellow-400 font-bold mb-2'>
                  💡 Did you mean:
                </div>
                <div className='space-y-1'>
                  {suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className='text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center space-x-2'
                    >
                      <span>▶</span>
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className='mt-3 text-gray-400'>
              Type <span className='text-green-400 font-bold'>'help'</span> for
              available commands.
            </div>
          </div>
        );
        isError = true;
    }

    setHistory([...history, { command: cmd, output, isError }]);
  };

  const getCommandType = (cmd: string): CommandType => {
    if (cmd === 'help') return 'help';
    if (cmd === 'about') return 'about';
    if (cmd === 'skills') return 'skills';
    if (cmd === 'projects') return 'projects';
    if (cmd === 'contact') return 'contact';
    if (cmd === 'education') return 'education';
    if (cmd === 'clear') return 'clear';
    if (cmd === 'version') return 'version';
    if (cmd === 'home') return 'home';
    return 'unknown';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleCommand(input);
      setInput('');
      setSuggestion('');
    }
  };

  const renderHelp = () => (
    <div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-6 space-y-6'>
      <div className='flex items-center space-x-3'>
        <FaTerminal className='text-cyan-400 text-xl' />
        <span className='text-white font-bold text-xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent'>
          Available Commands
        </span>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {[
          {
            cmd: 'help',
            desc: 'Show this help message',
            icon: '❓',
            color: 'text-cyan-400',
          },
          {
            cmd: 'about',
            desc: 'Display information about me',
            icon: '👨‍💻',
            color: 'text-blue-400',
          },
          {
            cmd: 'skills',
            desc: 'List technical skills',
            icon: '🛠️',
            color: 'text-purple-400',
          },
          {
            cmd: 'projects',
            desc: 'Show portfolio projects',
            icon: '🚀',
            color: 'text-green-400',
          },
          {
            cmd: 'contact',
            desc: 'Display contact information',
            icon: '📧',
            color: 'text-red-400',
          },
          {
            cmd: 'education',
            desc: 'View educational background',
            icon: '🎓',
            color: 'text-orange-400',
          },
          {
            cmd: 'clear',
            desc: 'Clear terminal screen',
            icon: '🧹',
            color: 'text-yellow-400',
          },
          {
            cmd: 'version',
            desc: 'Show CLI version',
            icon: '📋',
            color: 'text-indigo-400',
          },
          {
            cmd: 'home',
            desc: 'Return to welcome screen',
            icon: '🏠',
            color: 'text-pink-400',
          },
        ].map((item, i) => (
          <div
            key={i}
            className='group flex items-center p-4 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-lg hover:from-gray-600/40 hover:to-gray-700/40 transition-all duration-300 border border-gray-600/20 hover:border-gray-500/40'
          >
            <span className='text-2xl mr-4 group-hover:scale-110 transition-transform duration-300'>
              {item.icon}
            </span>
            <div className='flex-1'>
              <span
                className={`${item.color} font-bold text-lg group-hover:text-white transition-colors duration-300`}
              >
                {item.cmd}
              </span>
              <div className='text-gray-300 text-sm mt-1'>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className='bg-blue-900/20 border border-blue-500/30 rounded-lg p-4'>
        <div className='text-blue-400 font-bold mb-2'>💡 Pro Tips:</div>
        <div className='text-gray-300 space-y-1 text-sm'>
          <div>
            • Use <span className='text-cyan-400 font-mono'>TAB</span> for
            command autocompletion
          </div>
          <div>
            • Use <span className='text-cyan-400 font-mono'>↑/↓</span> arrows
            for command history
          </div>
          <div>• Commands are case-insensitive</div>
        </div>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className='bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 space-y-6'>
      <div className='flex items-center space-x-3'>
        <FaUser className='text-blue-400 text-xl' />
        <span className='text-white font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
          About Me
        </span>
      </div>
      <div className='text-gray-300 leading-relaxed space-y-4'>
        {about.bio.split('\n').map((paragraph, i) => (
          <p key={i} className='text-base'>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className='bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 space-y-6'>
      <div className='flex items-center space-x-3'>
        <FaCode className='text-purple-400 text-xl' />
        <span className='text-white font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
          Technical Skills
        </span>
      </div>
      <div className='space-y-6'>
        {Object.entries(skills).map(([category, items]) => (
          <div
            key={category}
            className='bg-gray-800/30 rounded-lg p-4 border border-gray-600/20'
          >
            <div className='flex items-center space-x-3 mb-4'>
              <div className='w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400'></div>
              <div className='text-yellow-400 font-bold text-lg'>
                {category}
              </div>
            </div>
            <div className='flex flex-wrap gap-3'>
              {items.map((skill, i) => (
                <span
                  key={i}
                  className='bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-gray-200 px-4 py-2 rounded-full text-sm font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 hover:scale-105'
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className='bg-gradient-to-br from-green-900/20 to-teal-900/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 space-y-6'>
      <div className='flex items-center space-x-3'>
        <FaFolderOpen className='text-green-400 text-xl' />
        <span className='text-white font-bold text-xl bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent'>
          Portfolio Projects
        </span>
      </div>
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
        {projects.map((project, i) => (
          <div
            key={i}
            className='group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-600/30 rounded-lg p-6 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02]'
          >
            <div className='text-yellow-400 font-bold text-lg mb-3 group-hover:text-yellow-300 transition-colors'>
              {project.name}
            </div>
            <div className='text-gray-300 mb-4 leading-relaxed'>
              {project.description}
            </div>
            <div className='flex flex-wrap gap-2 mb-4'>
              {project.technologies.map((tech, j) => (
                <span
                  key={j}
                  className='bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-green-500/30 text-white px-3 py-1 rounded-full text-xs font-medium'
                >
                  {tech}
                </span>
              ))}
            </div>
            <div className='space-y-2'>
              <a
                href={project.github}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group/link'
              >
                <FaGithub
                  size={16}
                  className='group-hover/link:scale-110 transition-transform'
                />
                <span className='font-medium'>GitHub Repository</span>
              </a>
              {project.demo && (
                <a
                  href={project.demo}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors group/link'
                >
                  <FaLink
                    size={16}
                    className='group-hover/link:scale-110 transition-transform'
                  />
                  <span className='font-medium'>Live Demo</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContact = () => (
    <div className='bg-gradient-to-br from-red-900/20 to-orange-900/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 space-y-6'>
      <div className='flex items-center space-x-3'>
        <FaEnvelope className='text-red-400 text-xl' />
        <span className='text-white font-bold text-xl bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent'>
          Get In Touch
        </span>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <a
          href={`mailto:${contact.email}`}
          className='group flex flex-col items-center p-6 bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-lg border border-red-500/30 hover:border-red-400/50 transition-all duration-300 hover:scale-105'
        >
          <div className='w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform'>
            <FaEnvelope size={20} className='text-white' />
          </div>
          <div className='text-white font-medium mb-1'>Email</div>
          <div className='text-gray-400 text-sm text-center'>
            {contact.email}
          </div>
        </a>
        <a
          href={contact.github}
          target='_blank'
          rel='noopener noreferrer'
          className='group flex flex-col items-center p-6 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-lg border border-gray-500/30 hover:border-gray-400/50 transition-all duration-300 hover:scale-105'
        >
          <div className='w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform'>
            <FaGithub size={20} className='text-white' />
          </div>
          <div className='text-white font-medium mb-1'>GitHub</div>
          <div className='text-gray-400 text-sm text-center'>
            {contact.github.replace('https://github.com/', '')}
          </div>
        </a>
        <a
          href={contact.linkedin}
          target='_blank'
          rel='noopener noreferrer'
          className='group flex flex-col items-center p-6 bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105'
        >
          <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform'>
            <FaLinkedin size={20} className='text-white' />
          </div>
          <div className='text-white font-medium mb-1'>LinkedIn</div>
          <div className='text-gray-400 text-sm text-center'>
            {contact.linkedin.replace('https://linkedin.com/in/', '')}
          </div>
        </a>
        <a
          href={contact.facebook}
          target='_blank'
          rel='noopener noreferrer'
          className='group flex flex-col items-center p-6 bg-gradient-to-br from-blue-800/20 to-blue-900/20 rounded-lg border border-blue-700/30 hover:border-blue-600/50 transition-all duration-300 hover:scale-105'
        >
          <div className='w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform'>
            <FaFacebook size={20} className='text-white' />
          </div>
          <div className='text-white font-medium mb-1'>Facebook</div>
          <div className='text-gray-400 text-sm text-center'>
            {contact.facebook.replace('https://facebook.com/', '')}
          </div>
        </a>
        <a
          href={contact.whatsapp}
          target='_blank'
          rel='noopener noreferrer'
          className='group flex flex-col items-center p-6 bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-lg border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105'
        >
          <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform'>
            <FaWhatsapp size={20} className='text-white' />
          </div>
          <div className='text-white font-medium mb-1'>WhatsApp</div>
          <div className='text-gray-400 text-sm text-center'>Message Me</div>
        </a>
        <a
          href={contact.instagram}
          target='_blank'
          rel='noopener noreferrer'
          className='group flex flex-col items-center p-6 bg-gradient-to-br from-pink-600/20 to-purple-700/20 rounded-lg border border-pink-500/30 hover:border-pink-400/50 transition-all duration-300 hover:scale-105'
        >
          <div className='w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform'>
            <FaInstagram size={20} className='text-white' />
          </div>
          <div className='text-white font-medium mb-1'>Instagram</div>
          <div className='text-gray-400 text-sm text-center'>
            {contact.instagram.replace('https://instagram.com/', '')}
          </div>
        </a>
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className='bg-gradient-to-br from-orange-900/20 to-amber-900/20 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6 space-y-6'>
      <div className='flex items-center space-x-3'>
        <FaGraduationCap className='text-orange-400 text-xl' />
        <span className='text-white font-bold text-xl bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent'>
          Education
        </span>
      </div>
      <div className='space-y-6'>
        {education.map((edu, i) => (
          <div
            key={i}
            className='bg-gradient-to-br from-orange-800/20 to-amber-800/20 rounded-lg border border-orange-500/30 p-5 hover:border-orange-400/50 transition-all duration-300'
          >
            <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-3'>
              <h3 className='text-white font-bold text-lg'>{edu.degree}</h3>
              <span className='text-orange-400 font-medium text-sm'>
                {edu.period}
              </span>
            </div>
            <div className='text-gray-300 mb-2'>
              {edu.institution},{' '}
              <span className='text-gray-400'>{edu.location}</span>
            </div>
            <p className='text-gray-400 text-sm'>{edu.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className='bg-gradient-to-br from-gray-900 via-black to-gray-900 w-full h-screen overflow-hidden relative'>
      {/* Animated background */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-900/5 via-purple-900/5 to-pink-900/5'></div>
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent'></div>

      {/* Terminal Container */}
      <div className='relative z-10 bg-gray-900/80 backdrop-blur-xl border border-gray-600/50 rounded-2xl shadow-2xl overflow-hidden w-full h-screen'>
        {/* Terminal Header */}
        <div className='bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm p-4 flex items-center space-x-3 border-b border-gray-600/50'>
          <div className='flex space-x-2'>
            <div className='w-4 h-4 rounded-full bg-red-500 shadow-lg hover:bg-red-400 transition-colors cursor-pointer'></div>
            <div className='w-4 h-4 rounded-full bg-yellow-500 shadow-lg hover:bg-yellow-400 transition-colors cursor-pointer'></div>
            <div className='w-4 h-4 rounded-full bg-green-500 shadow-lg hover:bg-green-400 transition-colors cursor-pointer'></div>
          </div>
          <div className='flex items-center space-x-2 ml-4'>
            <FaTerminal className='text-green-400' />
            <div className='text-gray-300 text-sm font-mono'>
              ~/minhaj-portfolio
            </div>
          </div>
        </div>

        {/* Terminal Content */}
        <div
          ref={terminalRef}
          className='p-6 h-[calc(100vh-64px)] overflow-y-auto font-mono text-sm'
        >
          {showWelcome && (
            <WelcomeScreen
              onComplete={() => {
                setWelcomeComplete(true);
              }}
            />
          )}

          {history.map((item, i) => (
            <div key={i} className='mb-6'>
              <div className='flex items-center text-gray-300 mb-3'>
                <span className='text-green-400 font-bold'>user@minhaj</span>
                <span className='text-gray-500 ml-2'>:~$</span>
                <span className='ml-3 font-medium'>{item.command}</span>
              </div>
              <div
                className={cn(
                  'mb-4',
                  item.isError ? 'text-red-400' : 'text-gray-300'
                )}
              >
                {item.output}
              </div>
            </div>
          ))}

          {/* Current input line - show after welcome animation completes */}
          {welcomeComplete && (
            <form
              onSubmit={handleSubmit}
              className='flex items-center text-gray-300'
            >
              <div className='flex items-center bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 rounded-lg p-3 flex-1'>
                <span className='text-green-400 font-bold'>user@minhaj</span>
                <span className='text-gray-500 ml-2'>:~$</span>
                <div className='ml-3 flex-1 relative'>
                  <input
                    ref={inputRef}
                    type='text'
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className='bg-transparent outline-none w-full caret-green-400 text-white'
                    autoComplete='off'
                    spellCheck='false'
                  />
                  {suggestion && (
                    <span className='absolute left-0 top-0 text-gray-600 pointer-events-none'>
                      {input}
                      <span className='text-gray-500'>{suggestion}</span>
                    </span>
                  )}
                </div>
                <span className='animate-pulse text-green-400 ml-2 text-lg'>
                  ▋
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Welcome Screen Component with Typing Animation
function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);

  const welcomeLines = [
    '',
    "Initializing Minhaj's Portfolio Terminal...",
    'Loading modules... ████████████████████ 100%',
    '',
    '╔══════════════════════════════════════╗',
    "║  ✨  M I N H A J ' S   P O R T A L  ✨  ║",
    '╚══════════════════════════════════════╝',
    '',
    '🚀 Full-Stack Developer | ⚛️ React Specialist | 🟢 Node.js Enthusiast',
    '',
    '✨ Welcome to my interactive portfolio terminal!',
    "💡 Type 'help' to explore available commands",
    '🔥 Use TAB for autocompletion, ↑/↓ for history',
    '',
    'System ready. Happy exploring! 🎉',
    '',
  ];

  useEffect(() => {
    if (currentLine >= welcomeLines.length) {
      setTimeout(() => {
        onComplete();
      }, 1000);
      return;
    }

    const currentLineText = welcomeLines[currentLine];

    if (currentChar < currentLineText.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const newLines = [...prev];
          if (!newLines[currentLine]) newLines[currentLine] = '';
          newLines[currentLine] = currentLineText.slice(0, currentChar + 1);
          return newLines;
        });
        setCurrentChar((prev) => prev + 1);
      }, 30);

      return () => clearTimeout(timer);
    } else {
      // Move to next line
      const timer = setTimeout(() => {
        setCurrentLine((prev) => prev + 1);
        setCurrentChar(0);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentLine, currentChar, onComplete]);

  return (
    <div className='mb-8 space-y-2'>
      {displayedLines.map((line, i) => (
        <div
          key={i}
          className={cn(
            'min-h-[1.5em] font-mono',
            i === 1
              ? 'text-cyan-400 font-bold'
              : i === 2
              ? 'text-green-400'
              : i >= 4 && i <= 9
              ? 'text-green-400 text-center'
              : i === 11
              ? 'text-blue-400 font-bold text-center'
              : i === 13 || i === 14 || i === 15
              ? 'text-yellow-400'
              : i === 17
              ? 'text-green-400 font-bold'
              : 'text-gray-300'
          )}
        >
          <pre className='whitespace-pre-wrap'>{line}</pre>
        </div>
      ))}
      {currentLine < welcomeLines.length && (
        <span className='animate-pulse text-green-400 text-lg inline-block'>
          █
        </span>
      )}
    </div>
  );
}
