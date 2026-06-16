import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  X, 
  Divide, 
  RotateCcw, 
  Trophy, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Gamepad2, 
  Check, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

// Import images from assets directory so Vite resolves them correctly
import heatblastImg from './assets/heatblast.png';
import fourarmsImg from './assets/fourarms.png';
import xlr8Img from './assets/xlr8.png';
import greymatterImg from './assets/greymatter.png';
import upgradeImg from './assets/upgrade.png';
import cannonboltImg from './assets/cannonbolt.png';

// Aliens data
const ALIENS = [
  { id: 'heatblast', name: 'Fuego', emoji: '🔥', description: '¡Lanza bolas de fuego con respuestas correctas!', color: '#ff5e00', power: 'Fuego', image: heatblastImg },
  { id: 'fourarms', name: 'Cuatro Brazos', emoji: '💪', description: '¡Superfuerza para aplastar los problemas!', color: '#ff3333', power: 'Fuerza', image: fourarmsImg },
  { id: 'xlr8', name: 'XLR8', emoji: '🦖', description: '¡Velocidad supersónica para calcular rápido!', color: '#00d5ff', power: 'Velocidad', image: xlr8Img },
  { id: 'greymatter', name: 'Materia Gris', emoji: '🧠', description: '¡Inteligencia alienígena para resolver todo!', color: '#a6ff00', power: 'Super Mente', image: greymatterImg },
  { id: 'upgrade', name: 'Ultra T', emoji: '📟', description: '¡Mejora la tecnología del Omnitrix!', color: '#00ff41', power: 'Tecnología', image: upgradeImg },
  { id: 'cannonbolt', name: 'Bola de Cañón', emoji: '🛡️', description: '¡CUIDADO! Activa operaciones muy difíciles para campeones.', color: '#ffd000', power: 'Super Coraza', image: cannonboltImg }
];

export default function App() {
  const [alien, setAlien] = useState(ALIENS[0]);
  const [operation, setOperation] = useState('suma'); // 'suma', 'resta', 'mult', 'div'
  const [difficulty, setDifficulty] = useState('facil'); // 'facil' (1-10), 'normal' (1-20)
  
  // Game states
  const [numA, setNumA] = useState(0);
  const [numB, setNumB] = useState(0);
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  
  // Progress states
  const [energy, setEnergy] = useState(0); // 0 to 100
  const [streak, setStreak] = useState(0);
  const [isTransformed, setIsTransformed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null); // null, true, false
  
  // Audio state (visual sound effects simulator since browser blocking auto-audio)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState('¡Hola! Selecciona tu héroe y pulsa en "Iniciar" para activar el Omnitrix.');

  // Play synthetic sound using Web Audio API
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'correct') {
        // High pleasant ding
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'incorrect') {
        // Low buzzer sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'transform') {
        // Futuristic sci-fi sweep
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } else if (type === 'click') {
        // Small click
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // Generate question
  const generateQuestion = () => {
    let a = 0;
    let b = 0;
    let correct = 0;
    
    const isCannonbolt = alien.id === 'cannonbolt';
    // Cannonbolt uses larger limits (difficulty up to 40)
    const limit = isCannonbolt ? 40 : (difficulty === 'facil' ? 10 : 20);

    if (operation === 'suma') {
      a = Math.floor(Math.random() * (limit - 1)) + 1;
      b = Math.floor(Math.random() * (limit - 1)) + 1;
      correct = a + b;
    } else if (operation === 'resta') {
      a = Math.floor(Math.random() * (limit - 2)) + 3; // Min 3
      b = Math.floor(Math.random() * (a - 1)) + 1;     // Keep positive result
      correct = a - b;
    } else if (operation === 'mult') {
      if (isCannonbolt) {
        // Harder multiplication for 6 year olds (factors 2 to 9)
        a = Math.floor(Math.random() * 8) + 2;
        b = Math.floor(Math.random() * 5) + 2;
      } else {
        a = Math.floor(Math.random() * 5) + 1;
        b = Math.floor(Math.random() * 5) + 1;
      }
      correct = a * b;
    } else if (operation === 'div') {
      if (isCannonbolt) {
        // Harder divisions
        const possibleResults = [3, 4, 5, 6, 7, 8, 9, 10];
        const selectedResult = possibleResults[Math.floor(Math.random() * possibleResults.length)];
        b = Math.floor(Math.random() * 5) + 2; // Divisor 2-6
        a = selectedResult * b;
        correct = selectedResult;
      } else {
        // Exact simple divisions
        const possibleResults = [1, 2, 3, 4, 5];
        const selectedResult = possibleResults[Math.floor(Math.random() * possibleResults.length)];
        b = Math.floor(Math.random() * 4) + 1; // Divisor 1-4
        a = selectedResult * b;
        correct = selectedResult;
      }
    }

    setNumA(a);
    setNumB(b);
    setCorrectAnswer(correct);
    setSelectedAnswer(null);
    setIsCorrect(null);

    // Generate option choices (4 options)
    const optionsSet = new Set();
    optionsSet.add(correct);

    while (optionsSet.size < 4) {
      let offset = Math.floor(Math.random() * 8) - 4;
      let wrongVal = correct + offset;
      if (wrongVal >= 0 && wrongVal !== correct) {
        optionsSet.add(wrongVal);
      }
    }

    // Shuffle options
    const optionsArray = Array.from(optionsSet).sort(() => Math.random() - 0.5);
    setOptions(optionsArray);
  };

  // Triggered on start or when changing operations/difficulty/alien
  useEffect(() => {
    generateQuestion();
  }, [operation, difficulty, alien]);

  // Handle answer choice
  const handleAnswerSelect = (option) => {
    if (selectedAnswer !== null || isTransformed) return; // Answer locked or already won
    setSelectedAnswer(option);
    
    if (option === correctAnswer) {
      setIsCorrect(true);
      playSound('correct');
      const newEnergy = Math.min(energy + 20, 100);
      setEnergy(newEnergy);
      setStreak(prev => prev + 1);
      
      const praises = [
        '¡Excelente! ¡El Omnitrix brilla con fuerza!',
        '¡Eso es correcto! ¡Ben está orgulloso de ti!',
        `¡Respuesta correcta! ¡Poder de ${alien.name} activado!`,
        '¡Eres un genio matemático!',
        '¡Genial! ¡Sigue así para transformarte!'
      ];
      setFeedbackMsg(praises[Math.floor(Math.random() * praises.length)]);

      if (newEnergy >= 100) {
        setTimeout(() => {
          setIsTransformed(true);
          playSound('transform');
          setFeedbackMsg(`¡OMNITRIX CARGADO! Te has transformado en ¡${alien.name.toUpperCase()}! 🔥💪🦖`);
        }, 1200);
      }
    } else {
      setIsCorrect(false);
      playSound('incorrect');
      setStreak(0);
      setFeedbackMsg('¡Casi! Intenta contar los símbolos verdes para encontrar la respuesta correcta.');
    }
  };

  const handleNextQuestion = () => {
    playSound('click');
    generateQuestion();
  };

  const handleResetGame = () => {
    playSound('click');
    setEnergy(0);
    setStreak(0);
    setIsTransformed(false);
    setFeedbackMsg('¡Omnitrix reiniciado! Elige tu alien y empieza de nuevo.');
    generateQuestion();
  };

  // Generate visual dots/blocks to help 6 year old child count
  const renderVisualAids = () => {
    if (operation === 'suma') {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', margin: '20px 0' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(57,255,20,0.1)' }}>
            <p style={{ fontSize: '0.9rem', color: varColor('text-muted'), marginBottom: '6px' }}>Cuenta {numA}:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {Array.from({ length: numA }).map((_, i) => (
                <span key={i} className="text-glow" style={{ fontSize: '1.4rem' }}>🟢</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.8rem', color: '#39ff14' }}>+</div>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(57,255,20,0.1)' }}>
            <p style={{ fontSize: '0.9rem', color: varColor('text-muted'), marginBottom: '6px' }}>Cuenta {numB}:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {Array.from({ length: numB }).map((_, i) => (
                <span key={i} className="text-glow" style={{ fontSize: '1.4rem' }}>🟢</span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (operation === 'resta') {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', margin: '20px 0' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(57,255,20,0.1)' }}>
            <p style={{ fontSize: '0.9rem', color: varColor('text-muted'), marginBottom: '8px' }}>
              Tienes {numA} símbolos y le quitamos {numB} (los rojos ❌):
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
              {Array.from({ length: numA }).map((_, i) => {
                const isRemoved = i >= (numA - numB);
                return (
                  <span key={i} style={{ fontSize: '1.6rem', filter: isRemoved ? 'grayscale(80%) opacity(40%)' : 'none' }}>
                    {isRemoved ? '❌' : '🟢'}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (operation === 'mult') {
      // Show as numA groups of numB
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
          <p style={{ fontSize: '0.9rem', color: varColor('text-muted'), marginBottom: '8px' }}>
            {numA} grupos de {numB} esferas de energía:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
            {Array.from({ length: numA }).map((_, g) => (
              <div key={g} style={{ border: '2px dashed #39ff14', borderRadius: '12px', padding: '8px', background: 'rgba(57,255,20,0.05)', display: 'flex', gap: '5px' }}>
                {Array.from({ length: numB }).map((_, i) => (
                  <span key={i} style={{ fontSize: '1.3rem' }}>🟢</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (operation === 'div') {
      // Repartir numA en numB grupos
      const itemsPerGroup = numA / numB;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
          <p style={{ fontSize: '0.9rem', color: varColor('text-muted'), marginBottom: '8px' }}>
            Reparte {numA} esferas en {numB} cajas iguales. ¿Cuántas esferas hay en cada caja?:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
            {Array.from({ length: numB }).map((_, g) => (
              <div key={g} style={{ border: '2px solid #555', borderRadius: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', width: '90px', minHeight: '60px', display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', width: '100%', color: '#888' }}>Caja {g+1}</span>
                {selectedAnswer !== null && Array.from({ length: itemsPerGroup }).map((_, i) => (
                  <span key={i} style={{ fontSize: '1.1rem' }}>🟢</span>
                ))}
                {selectedAnswer === null && <span style={{ fontSize: '1.2rem' }}>❓</span>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const varColor = (name) => {
    if (name === 'text-muted') return '#8c9c93';
    return '#39ff14';
  };

  return (
    <div className="omnitrix-container">
      {/* Top Bar with Audio & Settings */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(57,255,20,0.15)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="text-glow" style={{ fontSize: '1.8rem' }}>🟢</span>
          <div>
            <h1 className="tech-font text-glow" style={{ fontSize: '1.4rem', margin: 0, color: '#39ff14', textTransform: 'uppercase' }}>
              Academia Omnitrix
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#8c9c93', margin: 0 }}>Entrenamiento Matemático de Ben 10</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-omni" 
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Desactivar Sonido" : "Activar Sonido"}
            style={{ padding: '8px 12px', minWidth: '44px' }}
          >
            {soundEnabled ? <Volume2 size={18} color="#39ff14" /> : <VolumeX size={18} color="#8c9c93" />}
          </button>
          <button 
            className="btn-omni" 
            onClick={handleResetGame}
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <RotateCcw size={14} /> Reiniciar
          </button>
        </div>
      </div>

      {/* Main Game Screen */}
      {isTransformed ? (
        // TRANSFORMATION SCREEN (VICTORY)
        <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'float 3s ease-in-out infinite' }}>
          <div style={{ 
            position: 'relative', 
            width: '250px', 
            height: '250px', 
            margin: '0 auto 1.5rem auto', 
            borderRadius: '50%', 
            border: `5px solid ${alien.color}`, 
            boxShadow: `0 0 30px ${alien.color}, inset 0 0 20px rgba(0,0,0,0.6)`, 
            overflow: 'hidden', 
            backgroundColor: '#0a0e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={alien.image} 
              alt={alien.name} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                animation: 'pulseGreen 2s infinite' 
              }} 
            />
          </div>
          <h2 className="tech-font text-glow" style={{ fontSize: '2.5rem', color: alien.color, margin: '0 0 10px 0' }}>
            ¡TRANSFORMADO!
          </h2>
          <h3 className="tech-font" style={{ fontSize: '1.8rem', margin: '0 0 20px 0', color: '#fff' }}>
            Eres {alien.name} {alien.emoji}
          </h3>
          <p style={{ fontSize: '1.2rem', color: '#e0eae4', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.5' }}>
            Has resuelto suficientes operaciones matemáticas y cargado al 100% el Omnitrix. ¡Buen trabajo, héroe!
          </p>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button 
              className="btn-omni btn-omni-primary" 
              onClick={handleResetGame}
              style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
            >
              <Gamepad2 size={20} /> Jugar Otra Vez
            </button>
          </div>
        </div>
      ) : (
        // ACTIVE PLAY SCREEN
        <div>
          {/* Alien Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#8c9c93', marginBottom: '8px', textAlign: 'left', fontWeight: 'bold' }}>
              1. ELIGE TU ALIEN ADVERSARIO:
            </p>
            <div className="alien-selection">
              {ALIENS.map((a) => (
                <div 
                  key={a.id} 
                  className={`alien-card ${alien.id === a.id ? 'selected' : ''}`}
                  onClick={() => {
                    playSound('click');
                    setAlien(a);
                  }}
                >
                  <div className="alien-avatar-display">
                    {a.emoji}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#fff' }}>{a.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#8c9c93', marginTop: '4px' }}>{a.power}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Config: Operation & Difficulty */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ flex: '1 1 200px', textAlign: 'left' }}>
              <span style={{ fontSize: '0.8rem', color: '#8c9c93', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                2. OPERACIÓN:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <button 
                  onClick={() => { playSound('click'); setOperation('suma'); }} 
                  className={`btn-omni ${operation === 'suma' ? 'btn-omni-primary' : ''}`} 
                  style={{ padding: '8px' }}
                >
                  <Plus size={16} /> Suma
                </button>
                <button 
                  onClick={() => { playSound('click'); setOperation('resta'); }} 
                  className={`btn-omni ${operation === 'resta' ? 'btn-omni-primary' : ''}`}
                  style={{ padding: '8px' }}
                >
                  <Minus size={16} /> Resta
                </button>
                <button 
                  onClick={() => { playSound('click'); setOperation('mult'); }} 
                  className={`btn-omni ${operation === 'mult' ? 'btn-omni-primary' : ''}`}
                  style={{ padding: '8px' }}
                >
                  <X size={14} /> Mult.
                </button>
                <button 
                  onClick={() => { playSound('click'); setOperation('div'); }} 
                  className={`btn-omni ${operation === 'div' ? 'btn-omni-primary' : ''}`}
                  style={{ padding: '8px' }}
                >
                  <Divide size={16} /> Div.
                </button>
              </div>
            </div>

            <div style={{ flex: '0 0 150px', textAlign: 'left' }}>
              <span style={{ fontSize: '0.8rem', color: '#8c9c93', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                3. NÚMEROS:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => { playSound('click'); setDifficulty('facil'); }} 
                  className={`btn-omni ${difficulty === 'facil' ? 'btn-omni-primary' : ''}`}
                  style={{ flex: 1, padding: '8px 4px', fontSize: '0.8rem' }}
                >
                  1 al 10
                </button>
                <button 
                  onClick={() => { playSound('click'); setDifficulty('normal'); }} 
                  className={`btn-omni ${difficulty === 'normal' ? 'btn-omni-primary' : ''}`}
                  style={{ flex: 1, padding: '8px 4px', fontSize: '0.8rem' }}
                >
                  1 al 20
                </button>
              </div>
            </div>
          </div>

          {/* Omnitrix screen & Question display */}
          <div style={{ background: '#080c09', border: '3px solid #1c3624', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.9)' }}>
            
            {/* Hologram / Math Equation */}
            <div className="hologram-display">
              {numA} {operation === 'suma' ? '+' : operation === 'resta' ? '-' : operation === 'mult' ? '×' : '÷'} {numB} = ?
            </div>

            {/* Visual Aid */}
            {renderVisualAids()}
          </div>

          {/* Multiple Choice Answers */}
          <div className="options-grid">
            {options.map((option, idx) => {
              let btnClass = '';
              if (selectedAnswer !== null) {
                if (option === correctAnswer) {
                  btnClass = 'correct';
                } else if (option === selectedAnswer) {
                  btnClass = 'incorrect';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={selectedAnswer !== null}
                  className={`btn-option ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Navigation and feedbacks */}
          <div style={{ marginTop: '1.5rem', minHeight: '60px' }}>
            {selectedAnswer !== null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isCorrect ? 'rgba(57,255,20,0.1)' : 'rgba(255,59,48,0.1)', border: '1px solid ' + (isCorrect ? '#39ff14' : '#ff3b30'), padding: '12px 20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{isCorrect ? '✅' : '❌'}</span>
                  <span style={{ fontWeight: '600', color: isCorrect ? '#39ff14' : '#ff9e9e' }}>
                    {isCorrect ? '¡Correcto!' : `La respuesta era ${correctAnswer}`}
                  </span>
                </div>
                <button 
                  className="btn-omni btn-omni-primary" 
                  onClick={handleNextQuestion}
                  style={{ padding: '8px 16px' }}
                >
                  Siguiente <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Omnitrix Energy bar / Status */}
          <div style={{ borderTop: '1px solid rgba(57,255,20,0.1)', paddingTop: '1rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span className="tech-font" style={{ color: '#8c9c93' }}>CARGA DEL OMNITRIX:</span>
              <span className="tech-font text-glow" style={{ color: '#39ff14', fontWeight: 'bold' }}>{energy}%</span>
            </div>
            
            <div className="energy-bar-container">
              <div className="energy-bar-fill" style={{ width: `${energy}%` }}></div>
            </div>

            {/* Coach/Character Message */}
            <div className="character-message">
              <span style={{ fontSize: '1.8rem' }}>👽</span>
              <div style={{ fontSize: '0.9rem', color: '#e0eae4', lineHeight: '1.4' }}>
                {feedbackMsg}
              </div>
            </div>

            {/* Streak Counter */}
            {streak > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(57, 255, 20, 0.15)', border: '1px solid #39ff14', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#39ff14', fontWeight: 'bold' }}>
                <Sparkles size={12} /> ¡Racha de {streak} correctas!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
