import React, { useState, useEffect } from 'react';
import { Home, Search, Wallet, User, Users, TrendingUp, TrendingDown, Zap, Clock, Menu, Mail, Loader2, LogOut, Key, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Activity, Send, ChevronDown, Check, Bell, Bitcoin, Banknote, RefreshCw, Copy, Facebook, MessageCircle, Share2, Camera, Pencil, X, Gift, Instagram, Twitter, Youtube, FileText, Shield, ArrowLeft, Trash2, Trophy, Star, Target, Crosshair, Hexagon, Crown, BadgePercent, ChevronLeft, Bird, Skull, Coins, CarFront, AlertTriangle, Dribbble, Headphones, CreditCard, Radio, Flame, PlayCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Magic } from 'magic-sdk';
import { OAuthExtension } from '@magic-ext/oauth';
import { Toaster } from 'sonner';
import { toast } from './lib/toast';
import { generateStreetCoinzNotification, subscribeToWebPush } from './services/notificationService';
import { sendWelcomeEmail, sendBetReceiptEmail } from './services/emailService';
import { notifyDiscordLogin } from './services/discord';
import { saveUserWallet, fetchUserWalletHistory } from './lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ethers } from 'ethers';
import { AdminDashboard } from './components/AdminDashboard';
import { TrafficCameraGame } from './components/TrafficCameraGame';
import { DiceGame } from './components/games/DiceGame';
import { MinesGame } from './components/games/MinesGame';
import { RouletteGame } from './components/games/RouletteGame';
import { PlinkoGame } from './components/games/PlinkoGame';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apiv1.streetcoinz.com';

// Initialize Magic SDK
const magic = new Magic('pk_live_F7B9E3F735A2C120', {
  network: {
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    chainId: 56, // BNB Smart Chain Mainnet
  },
  extensions: [new OAuthExtension()],
});

// --- Types ---
import { OwnerDashboard } from './components/OwnerDashboard';


type Tab = 'home' | 'search' | 'wallet' | 'crypto-crash' | 'chicken-road' | 'admin' | 'owner' | 'dice' | 'roulette' | 'plinko' | 'mines';

interface Market {
  id: number;
  pair: string;
  price: string;
  volume: string;
  trend: string;
  sentiment: number;
  change24h?: number;
}

interface Bet {
  id: string;
  pair: string;
  direction: 'UP' | 'DOWN';
  amount: number;
  status: 'PENDING' | 'WON' | 'LOST';
  timestamp: number;
}

export interface HistoryActivity {
  id: string;
  type: 'game_bet' | 'crypto_bet' | 'deposit' | 'withdraw' | 'cashback' | 'referral';
  title: string;
  amount: number;
  status: 'WON' | 'LOST' | 'COMPLETED' | 'PENDING' | 'FAILED';
  date: string;
  details?: string;
}

interface LiveBet {
  id: number;
  game: string;
  user: string;
  username: string;
  amount: number;
  isWin: boolean;
  coin?: string;
}

// --- Mock Data ---
const INITIAL_MARKETS: Market[] = [
  { id: 1, pair: 'BTC IN 5M', price: '$64,230.50', volume: '50.2M', trend: 'up', sentiment: 68, change24h: 2.4 },
  { id: 2, pair: 'ETH IN 15M', price: '$3,450.20', volume: '24.5M', trend: 'down', sentiment: 42, change24h: -1.2 },
  { id: 3, pair: 'SOL IN 30M', price: '$145.80', volume: '12.1M', trend: 'up', sentiment: 82, change24h: 5.6 },
  { id: 4, pair: 'PAXG IN 1D', price: '$2,340.10', volume: '5.4M', trend: 'up', sentiment: 55, change24h: 0.8 },
  { id: 5, pair: 'XRP IN 1D', price: '$0.62', volume: '18.9M', trend: 'down', sentiment: 48, change24h: -0.5 },
  { id: 6, pair: 'DOGE IN 10M', price: '$0.15', volume: '32.1M', trend: 'up', sentiment: 75, change24h: 8.2 },
];

// --- Components ---

// --- Components ---

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const BitcoinIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#F7931A"/>
    <path fill="#FFF" d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.409-1.597-4.24 1.134-.26 1.99-1.003 2.217-2.538zm-3.962 5.617c-.542 2.179-4.206 1.003-5.392.707l.962-3.858c1.186.297 4.974.88 4.43 3.151zm.537-5.642c-.495 1.986-3.55.976-4.535.731l.872-3.5c.984.246 4.16.708 3.663 2.769z"/>
  </svg>
);

const EthereumIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#627EEA"/>
    <path fill="#FFF" d="M16 4.5L15.63 5.76V19.65L16 20.02L23.46 15.6L16 4.5Z" fillOpacity="0.602"/>
    <path fill="#FFF" d="M16 4.5L8.54 15.6L16 20.02V11.2V4.5Z"/>
    <path fill="#FFF" d="M16 21.4L15.77 21.68V27.18L16 27.85L23.46 17.51L16 21.4Z" fillOpacity="0.602"/>
    <path fill="#FFF" d="M16 27.85V21.4L8.54 17.51L16 27.85Z"/>
    <path fill="#FFF" d="M16 19.65L23.46 15.6L16 11.2V19.65Z" fillOpacity="0.2"/>
    <path fill="#FFF" d="M8.54 15.6L16 19.65V11.2L8.54 15.6Z" fillOpacity="0.602"/>
  </svg>
);

const BNBIcon = () => (
  <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png" alt="BNB" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
);

const SolanaIcon = () => (
  <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png" alt="SOL" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
);

const PaxgIcon = () => (
  <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/4705.png" alt="PAXG" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
);

const XrpIcon = () => (
  <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/52.png" alt="XRP" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
);

const DogeIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#C2A633"/>
    <path fill="#FFF" d="M11 9v14h6c3.8 0 7-3.1 7-7s-3.2-7-7-7h-6zm2 2h4c2.8 0 5 2.2 5 5s-2.2 5-5 5h-4v-10z"/>
    <path fill="#FFF" d="M9 15h7v2H9z"/>
  </svg>
);

const UsdtIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" alt="USDT" className={`${className} rounded-full`} referrerPolicy="no-referrer" />
);

const EthIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" alt="ETH" className={`${className} rounded-full`} referrerPolicy="no-referrer" />
);

const BnbIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png" alt="BNB" className={`${className} rounded-full`} referrerPolicy="no-referrer" />
);

const PolygonIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png" alt="POLYGON" className={`${className} rounded-full`} referrerPolicy="no-referrer" />
);

const getCoinIcon = (coin?: string, className: string = "w-4 h-4") => {
  switch (coin) {
    case 'ETH': return <EthIcon className={className} />;
    case 'BNB': return <BnbIcon className={className} />;
    case 'MATIC': return <PolygonIcon className={className} />;
    default: return <UsdtIcon className={className} />;
  }
};

function AuthModal({ isOpen, onClose, onLogin }: { isOpen: boolean; onClose: () => void; onLogin: (email: string, address?: string, platformWallet?: any) => void }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);

  if (!isOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await magic.auth.loginWithMagicLink({ email });
      
      const userMetadata = await magic.user.getInfo();
      const userEmail = userMetadata.email || email;
      const walletAddress = (userMetadata as any).publicAddress || '';
      
      onLogin(userEmail, walletAddress, null);
      onClose();
      
      // Send a welcome email via Resend
      try {
        sendWelcomeEmail(userEmail);
      } catch (e) {
        console.error('Failed to send welcome email', e);
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // @ts-ignore
      await magic.oauth.loginWithRedirect({
        provider: 'google',
        redirectURI: window.location.origin,
      });
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error('Google login failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-[#1e1e1e] w-full max-w-sm rounded-3xl p-6 relative z-10 border border-white/10 shadow-2xl"
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
        
        <h2 className="text-2xl font-bold mb-2 text-center">Welcome to <span className="text-[#a252f0]">StreetCoinz</span></h2>
        <p className="text-gray-400 text-center text-sm mb-8">Sign in to start playing.</p>

        <div className="space-y-3">
          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {!showEmailInput ? (
            <button 
              onClick={() => setShowEmailInput(true)}
              className="w-full bg-[#2a2a2a] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-[#333] transition-colors border border-white/5"
            >
              <Mail className="w-5 h-5" />
              Continue with Email
            </button>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white px-4 py-3.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#a252f0] transition-colors animate-in fade-in slide-in-from-bottom-2"
                autoFocus
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#a252f0] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-[#8e44d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isLoading ? 'Sending...' : 'Send Login Link'}
              </button>
            </form>
          )}

          <p className="text-center text-[10px] text-gray-500 mt-6 px-4">
            By continuing, you agree to our <a href="#" className="text-[#a252f0] hover:underline">Terms of Service</a> and <a href="#" className="text-[#a252f0] hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function UsernameModal({ isOpen, onSave }: { isOpen: boolean; onSave: (username: string) => void }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }
    
    onSave(username);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#1e1e1e] w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Welcome to StreetCoinz!</h2>
            <p className="text-gray-400">Please choose a username to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="e.g. crypto_king"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#a252f0] transition-colors"
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <button 
              type="submit"
              className="w-full bg-[#a252f0] text-white font-bold py-3.5 rounded-xl hover:bg-[#8e44d6] transition-colors"
            >
              Set Username
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function TermsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-[#1e1e1e] w-full max-w-lg rounded-3xl p-6 relative z-10 border border-white/10 shadow-2xl max-h-[85vh] flex flex-col"
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold">Terms of Service</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar pr-2 space-y-4 text-sm text-gray-300">
          <p className="text-xs text-gray-400 mb-4">Last Updated: March 6, 2026</p>
          <p>Welcome to StreetCoinz. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.</p>
          
          <h3 className="text-white font-bold text-base mt-6">1. Acceptance of Terms</h3>
          <p>By creating an account, accessing, or using StreetCoinz, you confirm that you have read, understood, and agree to be bound by these terms. If you do not agree with any part of these terms, you must not use our services.</p>
          
          <h3 className="text-white font-bold text-base mt-6">2. Description of Service (Crypto Casino Platform)</h3>
          <p>StreetCoinz is a premier online crypto casino and betting platform where users can wager real cryptocurrency on games and market price movements. By using our platform, you acknowledge and fully understand that you are participating in real-money gambling.</p>
          
          <h3 className="text-white font-bold text-base mt-6">3. Eligibility and Accounts</h3>
          <p>You must be at least 18 years old (or the legal age of majority in your jurisdiction) to create an account and gamble on this platform. You are solely responsible for ensuring that online gambling is legal in your jurisdiction. You are also fully responsible for maintaining the confidentiality of your account and crypto wallet credentials.</p>
          
          <h3 className="text-white font-bold text-base mt-6">4. Risks of Gambling</h3>
          <p>Participating in casino games and betting markets involves a significant risk of financial loss. You should only gamble with funds you can afford to lose. StreetCoinz is not responsible for any financial losses incurred while playing or betting on our platform. Please play and gamble responsibly.</p>
          
          <h3 className="text-white font-bold text-base mt-6">5. Prohibited Activities</h3>
          <p>You agree not to engage in any of the following prohibited activities:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Using the service for any illegal purpose or in violation of any local, state, national, or international law related to gambling and money laundering.</li>
            <li>Attempting to manipulate the betting markets, exploit system bugs, or use automated scripts (bots) without authorization.</li>
            <li>Harassing, abusing, or harming another person or group within the community.</li>
            <li>Interfering with or disrupting the integrity or performance of our server and blockchain services.</li>
          </ul>

          <h3 className="text-white font-bold text-base mt-6">6. Intellectual Property</h3>
          <p>All content, features, and functionality on StreetCoinz, including text, graphics, logos, and software, are the exclusive property of StreetCoinz and are protected by international copyright and intellectual property laws.</p>

          <h3 className="text-white font-bold text-base mt-6">7. Limitation of Liability</h3>
          <p>To the maximum extent permitted by applicable law, StreetCoinz shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from your use of our casino services.</p>
          
          <h3 className="text-white font-bold text-base mt-6">8. Changes to Terms</h3>
          <p>We reserve the right to modify these terms at any time. We will provide notice of significant changes by updating the date at the top of this document. Your continued use of the platform after such changes constitutes your acceptance of the new terms.</p>

          <h3 className="text-white font-bold text-base mt-6">9. Contact Us</h3>
          <p>If you have any questions about these Terms of Service, please contact our support team at <a href="mailto:support@streetcoinz.com" className="text-[#a252f0] hover:underline">support@streetcoinz.com</a>.</p>
        </div>
      </motion.div>
    </div>
  );
}

function PrivacyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-[#1e1e1e] w-full max-w-lg rounded-3xl p-6 relative z-10 border border-white/10 shadow-2xl max-h-[85vh] flex flex-col"
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold">Privacy Policy</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar pr-2 space-y-4 text-sm text-gray-300">
          <p className="text-xs text-gray-400 mb-4">Last Updated: March 6, 2026</p>
          <p>At StreetCoinz, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our crypto casino platform.</p>
          
          <h3 className="text-white font-bold text-base mt-6">1. Information We Collect</h3>
          <p>As a real-money crypto casino and betting platform, we collect information necessary to provide a secure and transparent gambling environment:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Data:</strong> Email address, username, and profile details provided during registration.</li>
            <li><strong>Financial & Blockchain Data:</strong> Connected crypto wallet addresses, deposit/withdrawal history, and transaction hashes.</li>
            <li><strong>Gaming Data:</strong> Comprehensive logs of your bets, casino game outcomes, winnings, losses, and tier progression (VIP/Tier).</li>
            <li><strong>Device & Access Data:</strong> IP address, browser type, and access times for security and fraud prevention purposes.</li>
          </ul>
          
          <h3 className="text-white font-bold text-base mt-6">2. How We Use Your Information</h3>
          <p>We use your information to operate our casino platform securely and efficiently:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Process your crypto deposits, game bets, and fund withdrawals.</li>
            <li>Maintain your casino account balance and VIP/Tier status in real-time.</li>
            <li>Detect and prevent fraudulent activities, cheating, or money laundering (AML).</li>
            <li>Send you casino promotional offers, bonuses, and administrative updates.</li>
            <li>Comply with legal and regulatory obligations related to online gambling operations.</li>
          </ul>
          
          <h3 className="text-white font-bold text-base mt-6">3. Disclosure of Your Information</h3>
          <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate potential violations of our policies, or to protect the rights, property, and safety of the platform and other users.</li>
            <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us, such as data analysis, email delivery, hosting services, and customer service.</li>
          </ul>
          <p>We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice.</p>
          
          <h3 className="text-white font-bold text-base mt-6">4. Data Security</h3>
          <p>We use administrative, technical, and physical security measures to help protect your personal information and crypto assets. While we have taken reasonable steps to secure the information you provide, please be aware that no security system is perfect or impenetrable.</p>
          
          <h3 className="text-white font-bold text-base mt-6">5. Your Privacy Rights</h3>
          <p>Depending on your location, you may have the right to request access to the personal information we collect from you, change that information, or delete it in some circumstances. To request to review, update, or delete your personal information, please contact us.</p>
          
          <h3 className="text-white font-bold text-base mt-6">6. Changes to This Privacy Policy</h3>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>

          <h3 className="text-white font-bold text-base mt-6">7. Contact Us</h3>
          <p>If you have questions or comments about this Privacy Policy, please contact us at <a href="mailto:support@streetcoinz.com" className="text-[#a252f0] hover:underline">support@streetcoinz.com</a>.</p>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileModal({ isOpen, onClose, user, email, userAddress, platformWallet, profilePic, onProfilePicChange, onNameChange, onLogout }: { isOpen: boolean; onClose: () => void; user: string | null; email: string | null; userAddress: string | null; platformWallet?: any; profilePic: string | null; onProfilePicChange: (pic: string) => void; onNameChange: (name: string) => void; onLogout: () => void }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user || '');
  const [isCopied, setIsCopied] = useState(false);
  const [isPlatformCopied, setIsPlatformCopied] = useState(false);
  const [showExportWarning, setShowExportWarning] = useState(false);

  useEffect(() => {
    setEditName(user || '');
  }, [user]);

  if (!isOpen || !user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onProfilePicChange(reader.result as string);
        toast.success('Profile picture updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyAddress = () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-[#1e1e1e] w-full max-w-sm rounded-3xl p-6 relative z-10 border border-white/10 shadow-2xl"
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4 group cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#a252f0] to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(162,82,240,0.3)] overflow-hidden">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 bg-[#1e1e1e] rounded-full p-1.5 border border-white/10 shadow-lg group-hover:bg-[#a252f0] transition-colors z-10">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-3 w-full px-4">
            {isEditingName ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editName.trim() && editName.trim() !== user) {
                  onNameChange(editName.trim());
                  setIsEditingName(false);
                  toast.success('Name updated successfully!');
                } else {
                  setIsEditingName(false);
                }
              }} className="w-full space-y-3">
                <div className="relative">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter new name"
                    className="w-full bg-[#2a2a2a] border border-white/10 rounded-xl px-4 py-3 text-center text-lg font-bold focus:outline-none focus:border-[#a252f0] transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setIsEditingName(false); setEditName(user || ''); }} 
                    className="flex-1 py-2.5 bg-white/5 rounded-xl text-white font-medium hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-[#a252f0] rounded-xl text-white font-medium hover:bg-[#8e44d6] transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                <h2 className="text-xl font-bold text-center truncate max-w-[200px]">{user}</h2>
                <div className="p-1.5 rounded-lg bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-[#a252f0] transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>
          {email && (
            <p className="text-sm text-gray-400 text-center mt-2">{email}</p>
          )}
          {userAddress && (
            <div className="flex flex-col items-center gap-2 mt-3 w-full">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-xs text-gray-400 font-bold">Alamat Wallet Magic:</span>
                <code className="text-xs text-gray-300 truncate max-w-[150px]">{userAddress}</code>
                <button 
                  onClick={handleCopyAddress}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                  title="Copy Magic Address"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] text-green-500 font-bold">COPIED</span>
                    </>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
          {platformWallet && (
            <div className="flex flex-col items-center gap-2 mt-2 w-full">
              <div className="flex items-center gap-2 bg-[#a252f0]/10 px-3 py-1.5 rounded-lg border border-[#a252f0]/30">
                <span className="text-xs text-[#a252f0] font-bold">Platform:</span>
                <code className="text-xs text-gray-300 truncate max-w-[150px]">{platformWallet.address}</code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(platformWallet.address);
                    setIsPlatformCopied(true);
                    setTimeout(() => setIsPlatformCopied(false), 2000);
                  }}
                  className="text-[#a252f0] hover:text-white transition-colors flex items-center gap-1"
                  title="Copy Platform Address"
                >
                  {isPlatformCopied ? (
                    <>
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] text-green-500 font-bold">COPIED</span>
                    </>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {showExportWarning ? (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            <h3 className="text-red-500 font-bold mb-2 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              Security Warning
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              WARNING: Never share your Web3 private key with anyone. Anyone who has your private key can take your assets.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowExportWarning(false)}
                className="flex-1 py-2.5 bg-white/5 rounded-xl text-white font-medium hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setShowExportWarning(false);
                  try {
                    // @ts-ignore
                    await magic.user.revealEVMPrivateKey();
                  } catch (error) {
                    console.error('Failed to export private key:', error);
                    toast.error('Failed to open export window');
                  }
                }}
                className="flex-1 py-2.5 bg-red-500 rounded-xl text-white font-medium hover:bg-red-600 transition-colors"
              >
                I Understand, Export
              </button>
            </div>
          </div>
        ) : (
          <>
            <button 
              onClick={() => setShowExportWarning(true)}
              className="w-full bg-white/5 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors mt-6 border border-white/5"
            >
              <Key className="w-5 h-5" />
              Export Web3 Private Key
            </button>

            <button 
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full bg-red-500/10 text-red-500 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors mt-3 border border-red-500/20"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

function Sidebar({ isOpen, onClose, onLogout, onLogin, onOpenReferral, onOpenProfile, onOpenNotification, onOpenTerms, onOpenPrivacy, onOpenTierStatus, user, email, userAddress, profilePic }: { isOpen: boolean; onClose: () => void; onLogout: () => void; onLogin: () => void; onOpenReferral: () => void; onOpenProfile: () => void; onOpenNotification: () => void; onOpenTerms: () => void; onOpenPrivacy: () => void; onOpenTierStatus: () => void; user: string | null; email: string | null; userAddress: string | null; profilePic: string | null }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-72 bg-[#1e1e1e] border-l border-white/10 z-[70] flex flex-col text-white"
          >
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5 shrink-0">
              <h2 className="text-xl font-bold">Menu</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
              {/* User Profile Section in Sidebar */}
              <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
              {user ? (
                <button 
                  onClick={() => { onClose(); onOpenProfile(); }} 
                  className="w-full flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#a252f0] to-purple-600 flex items-center justify-center shrink-0 overflow-hidden">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Signed in as</p>
                    <p className="text-sm font-bold truncate text-white">{user}</p>
                    {email && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{email}</p>
                    )}
                    {userAddress && (
                      <p className="text-[10px] text-[#a252f0] font-mono truncate mt-0.5">{userAddress}</p>
                    )}
                  </div>
                </button>
              ) : (
                <button 
                  onClick={() => {
                    onClose();
                    onLogin();
                  }}
                  className="w-full bg-[#a252f0] text-white font-bold py-3 rounded-xl hover:bg-[#8e44d6] transition-colors flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Sign In / Sign Up
                </button>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <SidebarItem icon={Crown} label="Tier Status" onClick={() => { onClose(); onOpenTierStatus(); }} />
              <SidebarItem icon={Bell} label="Notifications" onClick={() => { onClose(); onOpenNotification(); }} />
              <SidebarItem icon={User} label="Referral" onClick={() => { onClose(); onOpenReferral(); }} />
              <SidebarItem icon={FileText} label="Terms of Service" onClick={() => { onClose(); onOpenTerms(); }} />
              <SidebarItem icon={Shield} label="Privacy Policy" onClick={() => { onClose(); onOpenPrivacy(); }} />
              <SidebarItem icon={Headphones} label="Customer Support" onClick={() => { onClose(); window.location.href = 'mailto:support@streetcoinz.com'; }} />

              {user && (
                <div className="pt-4 mt-4 border-t border-white/10">
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">Log Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Community Section (Hidden on Mobile) */}
            <div className="hidden md:block mt-auto pt-6 border-t border-white/10 shrink-0 px-6 pb-6 bg-[#1e1e1e]">
              <p className="text-xs text-gray-500 font-medium mb-4 px-2 uppercase tracking-wider">Community</p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                <a href="https://discord.gg/guZeQxJb9" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-[#5865F2]/20 hover:text-[#5865F2] transition-colors group">
                  <svg className="w-5 h-5 mb-1 text-gray-400 group-hover:text-[#5865F2] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                  </svg>
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#5865F2] transition-colors">Discord</span>
                </a>
                <a href="https://www.facebook.com/share/16zBocQi7G/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-[#1877F2]/20 hover:text-[#1877F2] transition-colors group">
                  <Facebook className="w-5 h-5 mb-1 text-gray-400 group-hover:text-[#1877F2] transition-colors" />
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#1877F2] transition-colors">Facebook</span>
                </a>
                <a href="https://www.instagram.com/scz.universe?igsh=MWdoM280dHNzOGE2aA==" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-[#E1306C]/20 hover:text-[#E1306C] transition-colors group">
                  <Instagram className="w-5 h-5 mb-1 text-gray-400 group-hover:text-[#E1306C] transition-colors" />
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#E1306C] transition-colors">Instagram</span>
                </a>
                <a href="https://tiktok.com/@sczuniverse" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-[#00f2fe]/20 hover:text-[#00f2fe] transition-colors group">
                  <svg className="w-5 h-5 mb-1 text-gray-400 group-hover:text-[#00f2fe] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#00f2fe] transition-colors">TikTok</span>
                </a>
                <a href="https://x.com/sczuniverse" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/20 hover:text-white transition-colors group">
                  <svg className="w-5 h-5 mb-1 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-white transition-colors">X</span>
                </a>
                <a href="https://youtube.com/@streetcoinz?si=HhVUMV-8I3yMOZnv" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-[#FF0000]/20 hover:text-[#FF0000] transition-colors group">
                  <Youtube className="w-5 h-5 mb-1 text-gray-400 group-hover:text-[#FF0000] transition-colors" />
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#FF0000] transition-colors">YouTube</span>
                </a>
              </div>
              <div className="text-xs text-gray-500 text-center">
                v1.0.0 Alpha
              </div>
            </div>

            {/* Mobile Community Section (Scrollable) */}
            <div className="md:hidden mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-gray-500 font-medium mb-4 px-2 uppercase tracking-wider">Community</p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                <a href="https://discord.gg/guZeQxJb9" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-[#5865F2]/20 hover:text-[#5865F2] transition-colors group">
                  <svg className="w-5 h-5 mb-1 text-gray-400 group-hover:text-[#5865F2] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                  </svg>
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#5865F2] transition-colors">Discord</span>
                </a>
                <a href="https://www.facebook.com/share/16zBocQi7G/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-[#1877F2]/20 hover:text-[#1877F2] transition-colors group">
                  <Facebook className="w-5 h-5 mb-1 text-gray-400 group-hover:text-[#1877F2] transition-colors" />
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#1877F2] transition-colors">Facebook</span>
                </a>
                <a href="https://www.instagram.com/scz.universe?igsh=MWdoM280dHNzOGE2aA==" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-[#E1306C]/20 hover:text-[#E1306C] transition-colors group">
                  <Instagram className="w-5 h-5 mb-1 text-gray-400 group-hover:text-[#E1306C] transition-colors" />
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#E1306C] transition-colors">Instagram</span>
                </a>
                <a href="https://tiktok.com/@sczuniverse" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-[#00f2fe]/20 hover:text-[#00f2fe] transition-colors group">
                  <svg className="w-5 h-5 mb-1 text-gray-400 group-hover:text-[#00f2fe] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#00f2fe] transition-colors">TikTok</span>
                </a>
                <a href="https://x.com/sczuniverse" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/20 hover:text-white transition-colors group">
                  <svg className="w-5 h-5 mb-1 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-white transition-colors">X</span>
                </a>
                <a href="https://youtube.com/@streetcoinz?si=HhVUMV-8I3yMOZnv" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-[#FF0000]/20 hover:text-[#FF0000] transition-colors group">
                  <Youtube className="w-5 h-5 mb-1 text-gray-400 group-hover:text-[#FF0000] transition-colors" />
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#FF0000] transition-colors">YouTube</span>
                </a>
              </div>
              <div className="text-xs text-gray-500 text-center pb-4">
                v1.0.0 Alpha
              </div>
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SidebarItem({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#a252f0]/20 group-hover:text-[#a252f0] transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

function Header({ onMenuClick, user, onSignInClick, activeTab, onOpenActivityNotification, unreadCount }: { onMenuClick: () => void, user: string | null, onSignInClick: () => void, activeTab: Tab, onOpenActivityNotification: () => void, unreadCount: number }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#131212]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-50">
      <img 
        src="https://is3.cloudhost.id/streetcoinzstorage/STREETCOINZLOGOV2/streetcoinzlogo&name.png" 
        alt="StreetCoinz Logo" 
        className="h-8 w-auto object-contain"
      />
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <button 
              onClick={onOpenActivityNotification}
              className="relative w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#131212]"></span>
              )}
            </button>
            <button 
              onClick={onMenuClick}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-300" />
            </button>
          </>
        ) : (
          <button 
            onClick={onSignInClick}
            className="px-4 py-2 rounded-full bg-[#a252f0] text-white font-medium hover:bg-[#8a3fd9] transition-colors text-sm"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}



const exchangeRates = {
  USD: 1,
  IDR: 15500,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150
};

type Currency = keyof typeof exchangeRates;

function BottomNav({ activeTab, onTabChange, user, blockchainBalance, currency }: { activeTab: Tab; onTabChange: (tab: Tab) => void, user: string | null, blockchainBalance: number, currency: Currency }) {
  const isStreetCoinz = user === 'streetcoinz@gmail.com';
  const tradingBalance = isStreetCoinz ? 1240.50 : blockchainBalance;
  const personalBalance = isStreetCoinz ? 540.20 : 0;
  const totalBalance = tradingBalance + personalBalance;

  const rate = exchangeRates[currency] || 1;
  const converted = totalBalance * rate;
  
  const formattedBalance = new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'IDR' || currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'IDR' || currency === 'JPY' ? 0 : 2,
  }).format(converted);

  return (
    <nav className={`fixed bottom-0 left-0 right-0 h-20 bg-[#131212]/95 backdrop-blur-xl border-t border-white/5 flex items-center ${['admin@streetcoinz.com', 'streetcoinz@gmail.com', 'streetcoinzbeta@gmail.com'].includes(user || '') ? 'justify-around px-4' : 'justify-between px-12'} pb-1 z-50`}>
      <NavButton icon={Home} label="Home" isActive={activeTab === 'home'} onClick={() => onTabChange('home')} />
      <NavButton icon={Search} label="Search" isActive={activeTab === 'search'} onClick={() => onTabChange('search')} />
      <NavButton icon={Wallet} label={user ? formattedBalance : "Wallet"} isActive={activeTab === 'wallet'} onClick={() => onTabChange('wallet')} />
      {['admin@streetcoinz.com', 'streetcoinz@gmail.com', 'streetcoinzbeta@gmail.com'].includes(user || '') && (
        <NavButton icon={Shield} label="Admin" isActive={activeTab === 'admin'} onClick={() => onTabChange('admin')} />
      )}
      {user === 'streetcoinz@gmail.com' && (
        <NavButton icon={Crown} label="Owner" isActive={activeTab === 'owner'} onClick={() => onTabChange('owner')} />
      )}
    </nav>
  );
}

function NavButton({ icon: Icon, label, isActive, onClick }: { icon: any; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-14 gap-1 transition-all duration-200 ${isActive ? 'text-[#a252f0]' : 'text-gray-500 hover:text-gray-300'}`}
    >
      <Icon className={`w-6 h-6 ${isActive ? 'fill-current/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
    </button>
  );
}

const SemiCircleGauge = ({ percentage }: { percentage: number }) => {
  const radius = 24;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 50 ? "#26A17B" : "#E53E3E";

  return (
    <div className="relative flex flex-col items-center justify-center w-14 h-8 mt-1">
      <svg width="56" height="32" viewBox="0 0 56 32" className="overflow-visible absolute top-0">
        <path
          d="M 4 28 A 24 24 0 0 1 52 28"
          fill="none"
          stroke="#333"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 4 28 A 24 24 0 0 1 52 28"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center leading-none">
        <span className="text-[10px] font-bold text-white">{percentage}%</span>
        <span className="text-[6px] text-gray-500 uppercase tracking-widest mt-0.5">{percentage >= 50 ? 'BULL' : 'BEAR'}</span>
      </div>
    </div>
  );
};

const MarketCard: React.FC<{ market: Market; onBet: (market: Market, direction: 'UP' | 'DOWN') => void; onSelect?: (market: Market) => void }> = ({ market, onBet, onSelect }) => {
  const getIcon = (pair: string) => {
    if (pair.includes('BTC')) return <BitcoinIcon />;
    if (pair.includes('ETH') && !pair.includes('SOL')) return <EthereumIcon />;
    if (pair.includes('SOL')) return <SolanaIcon />;
    if (pair.includes('PAXG')) return <PaxgIcon />;
    if (pair.includes('XRP')) return <XrpIcon />;
    if (pair.includes('DOGE')) return <DogeIcon />;
    if (pair.includes('BNB')) return <BNBIcon />;
    return null;
  };

  return (
    <div 
      onClick={() => onSelect && onSelect(market)}
      className="bg-[#1e1e1e] rounded-2xl p-4 border border-white/5 relative overflow-hidden group hover:border-[#a252f0]/50 transition-all duration-300 cursor-pointer">
      <div className="absolute inset-0 bg-gradient-to-br from-[#a252f0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1 border border-white/5 h-fit">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-mono text-gray-300 tracking-wider">LIVE MARKET</span>
        </div>
        <SemiCircleGauge percentage={market.sentiment} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getIcon(market.pair)}
          <div>
            <h3 className="text-lg font-bold leading-none">{market.pair}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold font-mono text-white">{market.price}</span>
              <span className={`text-[10px] font-bold ${market.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {market.trend === 'up' ? '+' : ''}{market.change24h !== undefined ? market.change24h.toFixed(2) : '0.00'}%
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-0.5">24h Volume</p>
          <p className="font-mono font-bold text-gray-400">{market.volume}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onBet(market, 'UP'); }}
          className="bg-[#26A17B] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#1e8262] transition-colors flex flex-col items-center justify-center gap-1 shadow-lg shadow-[#26A17B]/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            UP
          </div>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onBet(market, 'DOWN'); }}
          className="bg-[#EF4444] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#c93636] transition-colors flex flex-col items-center justify-center gap-1 shadow-lg shadow-[#EF4444]/20">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            DOWN
          </div>
        </button>
      </div>
    </div>
  );
};

// --- Screens ---

const OriginalGameCard: React.FC<{ title: string, provider: string, image: string, onClick: () => void | string | number }> = ({ title, provider, image, onClick }) => {
  const activePlayers = React.useMemo(() => {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    let hash = 0;
    const str = title + dateString;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 900 + 50;
  }, [title]);

  return (
    <div 
      onClick={onClick}
      className="bg-[#1C1C1E] rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#14F195] transition-all group"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse" />
          <span className="text-[10px] font-medium text-white">{activePlayers}</span>
          <User className="w-3 h-3 text-white" />
        </div>
        <div className="absolute top-2 right-2 bg-red-500/20 border border-red-500/50 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 z-10 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
          <Flame className="w-3 h-3 text-red-500" fill="currentColor" />
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Hot</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h4 className="font-bold text-white text-sm truncate">{title}</h4>
          <p className="text-xs">
            {provider === 'StreetCoinz Games' ? (
              <span className="text-[#a252f0] font-bold">{provider}</span>
            ) : (
              <span className="text-gray-400">{provider}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

const HomeScreen = ({ markets, onBet, onSelectMarket, onStartPlaying, onSelectOriginalGame, onOpenTerms, onOpenPrivacy, liveBets, isLoggedIn, userVolume = 1250 }: { markets: Market[], onBet: (market: Market, direction: 'UP' | 'DOWN') => void, onSelectMarket: (market: Market) => void, onStartPlaying: () => void, onSelectOriginalGame: (gameId: string) => void, onOpenTerms: () => void, onOpenPrivacy: () => void, liveBets: LiveBet[], isLoggedIn?: boolean, userVolume?: number }) => {
  const [activeTab, setActiveTab] = useState<'crypto' | 'originals' | 'traffic' | 'sports'>('originals');

  const [activePlayers, setActivePlayers] = useState<string>('');
  const [dailyVolume, setDailyVolume] = useState<string>('');

  useEffect(() => {
    const updateDailyStats = () => {
      const today = new Date();
      const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
      
      // Update active players
      let hashPlayers = 0;
      const strPlayers = "Arena" + dateString;
      for (let i = 0; i < strPlayers.length; i++) {
        hashPlayers = ((hashPlayers << 5) - hashPlayers) + strPlayers.charCodeAt(i);
        hashPlayers |= 0;
      }
      setActivePlayers((Math.abs(hashPlayers) % 5000 + 1000).toLocaleString());

      // Update daily volume
      let hashVol = 0;
      for (let i = 0; i < dateString.length; i++) {
        hashVol = ((hashVol << 5) - hashVol) + dateString.charCodeAt(i);
        hashVol |= 0;
      }
      const baseVol = 1.2;
      const variation = (Math.abs(hashVol) % 50) / 100;
      setDailyVolume((baseVol + variation).toFixed(2) + 'B');
    };

    updateDailyStats();
    
    // Check every minute if the day has changed
    const interval = setInterval(updateDailyStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const originalGames = [
    { id: '1', title: 'Crash', provider: 'StreetCoinz Games', image: 'https://is3.cloudhost.id/streetcoinzstorage/GAMES/Crash.jpg' },
    { id: '2', title: 'Chicken', provider: 'StreetCoinz Games', image: 'https://is3.cloudhost.id/streetcoinzstorage/GAMES/Chicken.jpg' },
    { id: '3', title: 'Dice', provider: 'StreetCoinz Games', image: 'https://is3.cloudhost.id/streetcoinzstorage/GAMES/Dice.jpg' },
    { id: '4', title: 'Roulette', provider: 'StreetCoinz Games', image: 'https://is3.cloudhost.id/streetcoinzstorage/GAMES/Roulette.jpg' },
    { id: '5', title: 'Plinko', provider: 'StreetCoinz Games', image: 'https://is3.cloudhost.id/streetcoinzstorage/GAMES/Plinko.jpg' },
    { id: '6', title: 'Mines', provider: 'StreetCoinz Games', image: 'https://is3.cloudhost.id/streetcoinzstorage/GAMES/Mines.jpg' },
  ];

  const getTierInfo = (volume: number) => {
    if (volume < 5000) return { name: 'Rookie', next: 'Grinder', max: 5000, color: 'text-[#8B4513]', bg: 'bg-[#8B4513]', from: 'from-[#8B4513]', to: 'to-[#A0522D]' };
    if (volume < 20000) return { name: 'Grinder', next: 'Tactician', max: 20000, color: 'text-gray-300', bg: 'bg-gray-300', from: 'from-gray-500', to: 'to-gray-300' };
    if (volume < 80000) return { name: 'Tactician', next: 'Enforcer', max: 80000, color: 'text-blue-500', bg: 'bg-blue-500', from: 'from-blue-600', to: 'to-blue-400' };
    if (volume < 150000) return { name: 'Enforcer', next: 'Architect', max: 150000, color: 'text-red-500', bg: 'bg-red-500', from: 'from-red-600', to: 'to-red-400' };
    if (volume < 300000) return { name: 'Architect', next: 'Syndicate', max: 300000, color: 'text-yellow-500', bg: 'bg-yellow-500', from: 'from-yellow-600', to: 'to-yellow-400' };
    return { name: 'Syndicate', next: 'MAX', max: 300000, color: 'text-purple-500', bg: 'bg-purple-500', from: 'from-purple-600', to: 'to-purple-400' };
  };

  const tierInfo = getTierInfo(userVolume);
  const progress = tierInfo.name === 'Syndicate' ? 100 : Math.min((userVolume / tierInfo.max) * 100, 100);

  return (
    <div className="space-y-8 pb-24 pt-20 px-4 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section>
        {isLoggedIn ? (
          <div className="bg-[#1e1e1e] rounded-xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#a252f0]/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md mb-2 border border-white/5">
                    <Trophy className={`w-3 h-3 ${tierInfo.color}`} />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-gray-300">Tier Status</span>
                  </div>
                  <h3 className={`text-xl font-bold mb-0.5 ${tierInfo.color}`}>{tierInfo.name} Tier</h3>
                  <p className="text-xs text-gray-400">Increase volume to level up</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${tierInfo.color}`}>${userVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  {tierInfo.name !== 'Syndicate' && (
                    <span className="text-xs text-gray-500"> / ${tierInfo.max.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${tierInfo.from} ${tierInfo.to} rounded-full relative`}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                </motion.div>
              </div>
              <div className="mt-3 flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                <span>Current: {tierInfo.name}</span>
                {tierInfo.name !== 'Syndicate' && (
                  <span className={tierInfo.color}>Next: {tierInfo.next}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#a252f0] to-purple-600 rounded-xl p-4 text-white shadow-lg shadow-purple-900/20 relative overflow-hidden border border-white/10">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1 bg-black/30 backdrop-blur-md px-2 py-1 rounded-full mb-2 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse"></span>
                <span className="text-[10px] font-medium text-white">{activePlayers}</span>
                <User className="w-3 h-3 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1">Crypto Games Arena</h3>
              <p className="text-xs opacity-90 mb-4 max-w-[200px]">Play games and bet on crypto price movements.</p>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={onStartPlaying}
                  className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Start Playing
                </button>
                <div className="text-[10px] font-mono">
                  <span className="opacity-60 block">24H VOL</span>
                  <div className="flex items-center gap-1">
                    <UsdtIcon className="w-3 h-3" />
                    <span className="font-bold text-sm">{dailyVolume}</span>
                  </div>
                </div>
              </div>
            </div>
            <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full" />
          </div>
        )}
      </section>

      {/* Live Markets & Originals */}
      <section id="live-markets">
        <div className="flex items-center gap-4 mb-4 border-b border-gray-800">
          <button 
            onClick={() => setActiveTab('originals')}
            className={`pb-2 text-lg font-bold transition-colors relative ${activeTab === 'originals' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Games
            {activeTab === 'originals' && (
              <motion.div layoutId="home-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#14F195]" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('crypto')}
            className={`pb-2 text-lg font-bold transition-colors relative ${activeTab === 'crypto' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Crypto
            {activeTab === 'crypto' && (
              <motion.div layoutId="home-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#14F195]" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('traffic')}
            className={`pb-2 text-lg font-bold transition-colors relative ${activeTab === 'traffic' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Traffic
            {activeTab === 'traffic' && (
              <motion.div layoutId="home-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#14F195]" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('sports')}
            className={`pb-2 text-lg font-bold transition-colors relative ${activeTab === 'sports' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Sports
            {activeTab === 'sports' && (
              <motion.div layoutId="home-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#14F195]" />
            )}
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          {activeTab === 'crypto' && (
            <motion.div 
              key="crypto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {markets.map(market => (
                <MarketCard key={market.id} market={market} onBet={onBet} onSelect={onSelectMarket} />
              ))}
            </motion.div>
          )}
          
          {activeTab === 'originals' && (
            <motion.div 
              key="originals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            >
              {originalGames.map(game => (
                <OriginalGameCard 
                  key={game.id} 
                  title={game.title} 
                  provider={game.provider} 
                  image={game.image} 
                  onClick={() => onSelectOriginalGame(game.id)} 
                />
              ))}
            </motion.div>
          )}

          {activeTab === 'traffic' && (
            <motion.div 
              key="traffic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <CarFront className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Traffic Betting</h3>
              <p className="text-gray-400 max-w-xs">
                Bet on real-world traffic camera feeds. Coming soon!
              </p>
            </motion.div>
          )}

          {activeTab === 'sports' && (
            <motion.div 
              key="sports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <Dribbble className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Sports Betting</h3>
              <p className="text-gray-400 max-w-xs">
                Bet on your favorite sports teams and matches. Coming soon!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Live Bets Section */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-[#14F195] fill-[#14F195]/20 animate-pulse" />
            Live Bets
          </h3>
        </div>
        
        <div className="bg-[#1e1e1e] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">USER</th>
                  <th className="px-4 py-3 font-medium">Game/Market</th>
                  <th className="px-4 py-3 font-medium">Wallet Address</th>
                  <th className="px-4 py-3 font-medium text-right">Bet Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence initial={false}>
                  {liveBets.map((bet) => (
                    <motion.tr 
                      key={bet.id}
                      initial={{ opacity: 0, y: -20, backgroundColor: 'rgba(20, 241, 149, 0.1)' }}
                      animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className={`px-4 py-3 font-medium ${bet.username === 'Anonim' ? 'text-gray-400' : 'text-white'}`}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {bet.username}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{bet.game}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono">{bet.user}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        <div className="flex items-center justify-end gap-1.5">
                          {bet.coin === 'ETH' ? bet.amount.toFixed(4) : bet.coin === 'BNB' ? bet.amount.toFixed(3) : bet.amount.toFixed(2)}
                          {getCoinIcon(bet.coin)}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-white/10 text-center text-gray-500 text-xs pb-8">
        <div className="flex justify-center gap-4 mb-8">
          <a href="https://discord.gg/guZeQxJb9" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-[#5865F2]/20 hover:text-[#5865F2] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
            </svg>
          </a>
          <a href="https://www.facebook.com/share/16zBocQi7G/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-[#1877F2]/20 hover:text-[#1877F2] transition-colors">
            <Facebook className="w-5 h-5" />
          </a>
          <a href="https://www.instagram.com/scz.universe?igsh=MWdoM280dHNzOGE2aA==" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-[#E1306C]/20 hover:text-[#E1306C] transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="https://tiktok.com/@sczuniverse" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-[#00f2fe]/20 hover:text-[#00f2fe] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
          <a href="https://x.com/sczuniverse" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/20 hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="https://youtube.com/@streetcoinz?si=HhVUMV-8I3yMOZnv" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-[#FF0000]/20 hover:text-[#FF0000] transition-colors">
            <Youtube className="w-5 h-5" />
          </a>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
          <button onClick={onOpenTerms} className="hover:text-white transition-colors">Terms of Service</button>
          <button onClick={onOpenPrivacy} className="hover:text-white transition-colors">Privacy Policy</button>
          <a href="mailto:support@streetcoinz.com" className="hover:text-white transition-colors">Contact Us</a>
        </div>
        
        <div className="max-w-3xl mx-auto mt-8 pt-8 border-t border-white/5 text-[10px] leading-relaxed text-gray-600 text-left px-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-gray-500" />
            <span className="font-bold text-gray-400 text-xs uppercase tracking-wider">Trusted & Regulated</span>
          </div>
          <p className="mb-3">
            StreetCoinz is operated by StreetCoinz Entertainment N.V., a company incorporated under the laws of Curaçao with company registration number 158203 and having its registered address at Abraham de Veerstraat 9, Willemstad, Curaçao.
          </p>
          <p className="mb-3">
            StreetCoinz Entertainment N.V. is licensed and regulated by the Government of Curaçao and operates under the Master License of Gaming Services Provider, N.V. #365/JAZ as an Information Service Provider. They have passed all compliance and are legally authorized to conduct gaming operations for all games of chance and wagering.
          </p>
          <p className="mb-6">
            Payment processing is handled by StreetCoinz Payments Limited, registered in Cyprus with registration number HE 412356, having its registered office at Chytron, 30, 2nd Floor, Flat/Office A22, 1075, Nicosia, Cyprus.
          </p>
          
          <div className="flex flex-col items-center justify-center text-center border-t border-white/5 pt-6">
            <p className="mb-2 text-gray-500">© StreetCoinz 2026. All rights reserved.</p>
            <p className="max-w-md mx-auto">
              18+ Only. Gambling can be addictive. Please play responsibly. StreetCoinz is a crypto-based prediction and gaming platform. Cryptocurrency values can fluctuate widely. Terms and Conditions apply.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const SearchScreen = ({ markets, onSelectMarket }: { markets: Market[], onSelectMarket: (market: Market) => void }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMarkets = markets.filter(market => 
    market.pair.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickFilters = [
    { symbol: 'BTC', Icon: BitcoinIcon },
    { symbol: 'ETH', Icon: EthereumIcon },
    { symbol: 'SOL', Icon: SolanaIcon },
    { symbol: 'PAXG', Icon: PaxgIcon },
    { symbol: 'XRP', Icon: XrpIcon },
    { symbol: 'DOGE', Icon: DogeIcon },
    { symbol: 'BNB', Icon: BNBIcon },
  ];

  return (
    <div className="pt-20 px-4 pb-24 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Search Markets</h2>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search pairs (e.g., BTC, ETH)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e1e1e] text-white pl-12 pr-4 py-3.5 rounded-xl border border-white/10 focus:border-[#a252f0] focus:outline-none transition-colors"
          />
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {quickFilters.map((filter) => (
            <button
              key={filter.symbol}
              onClick={() => setSearchQuery(searchQuery.toUpperCase() === filter.symbol ? '' : filter.symbol)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors whitespace-nowrap ${
                searchQuery.toUpperCase() === filter.symbol
                  ? 'bg-[#a252f0]/20 border-[#a252f0] text-white'
                  : 'bg-[#1e1e1e] border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 [&>img]:w-5 [&>img]:h-5">
                <filter.Icon />
              </div>
              <span className="font-bold text-sm">{filter.symbol}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((market) => {
            const marketSymbol = market.pair.split(' ')[0];
            const MarketIcon = quickFilters.find(f => f.symbol === marketSymbol)?.Icon;

            return (
              <div 
                key={market.id} 
                onClick={() => onSelectMarket(market)}
                className="bg-[#1e1e1e] p-4 rounded-xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6 [&>img]:w-6 [&>img]:h-6">
                    {MarketIcon ? <MarketIcon /> : <Activity className="w-5 h-5 text-[#a252f0]" />}
                  </div>
                  <div>
                    <h3 className="font-bold">{market.pair}</h3>
                    <p className="text-xs text-gray-400">Vol: {market.volume}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-white">{market.price}</p>
                  <p className={`text-xs font-bold ${market.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {market.trend === 'up' ? '+' : ''}{market.change24h !== undefined ? market.change24h.toFixed(2) : '0.00'}%
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No markets found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ReferralClaimModal = ({ isOpen, onClose, onClaim, amount }: { isOpen: boolean; onClose: () => void; onClaim: () => void; amount: number }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1e1e1e] w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-[#14F195]" />
              Referral Rewards
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#14F195]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-[#14F195]" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">{amount.toFixed(2)} USDT</h4>
            <p className="text-gray-400 text-sm">Available to claim from your referrals</p>
          </div>

          <div className="bg-black/20 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Total Referrals</span>
              <span className="font-bold">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Earned</span>
              <span className="font-bold text-[#14F195]">0.00 USDT</span>
            </div>
          </div>

          <button 
            onClick={() => {
              if (amount > 0) {
                onClaim();
                onClose();
              }
            }}
            disabled={amount <= 0}
            className={`w-full font-bold py-3 rounded-xl transition-colors ${amount > 0 ? 'bg-[#14F195] text-black hover:bg-[#14F195]/90' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
          >
            {amount > 0 ? 'Claim Rewards' : 'Nothing to Claim'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const CashbackModal = ({ isOpen, onClose, onClaim, amount }: { isOpen: boolean; onClose: () => void; onClaim: () => void; amount: number }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1e1e1e] w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Gift className="w-6 h-6 text-[#a252f0]" />
              Weekly Cashback
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#a252f0]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-10 h-10 text-[#a252f0]" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">{amount.toFixed(2)} USDT</h4>
            <p className="text-gray-400 text-sm">Available cashback for this week</p>
          </div>

          <div className="bg-black/20 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Weekly Volume</span>
              <span className="font-bold">0.00 USDT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Cashback Rate</span>
              <span className="font-bold text-[#a252f0]">0%</span>
            </div>
          </div>

          <button 
            onClick={() => {
              if (amount > 0) {
                onClaim();
                onClose();
              }
            }}
            disabled={amount <= 0}
            className={`w-full font-bold py-3 rounded-xl transition-colors ${amount > 0 ? 'bg-[#a252f0] text-white hover:bg-[#a252f0]/90' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
          >
            {amount > 0 ? 'Claim Cashback' : 'Nothing to Claim'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const WalletScreen = ({ bets, user, userAddress, depositAddress, platformWallet, onLogin, currency, setCurrency, blockchainBalance, blockchainAssets, activityHistory, onAddActivity, onAddNotification, referralBalance, setReferralBalance, cashbackBalance, setCashbackBalance }: { bets: Bet[], user: string | null, userAddress: string | null, depositAddress?: string | null, platformWallet?: any, onLogin: () => void, currency: Currency, setCurrency: (c: Currency) => void, blockchainBalance: number, blockchainAssets: { eth: number, bnb: number, matic: number, usdt: number, ethUsd: number, bnbUsd: number, maticUsd: number, usdtUsd: number, totalUsd: number }, activityHistory: HistoryActivity[], onAddActivity: (activity: Omit<HistoryActivity, 'id' | 'date'>) => void, onAddNotification: (type: string, title: string, message: string, icon: string, color: string, bg: string) => void, referralBalance: number, setReferralBalance: (val: number) => void, cashbackBalance: number, setCashbackBalance: (val: number) => void }) => {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<'active' | 'deposit' | 'withdraw' | 'history'>('active');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('ERC20');
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isCashbackOpen, setIsCashbackOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const [dbBalance, setDbBalance] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const fetchBalance = async () => {
      try {
        const res = await fetch(`https://nyoxxkxueuorhvcnzgxu.supabase.co/rest/v1/users_wallets?email=eq.${encodeURIComponent(user)}&select=balance,evm_address`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55b3h4a3h1ZXVvcmh2Y256Z3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzMyMTIsImV4cCI6MjA4NzQ0OTIxMn0.tgmihtWQcrsYLjRXq19YdVOud7xaAY7xPN3zbI3KGTA'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setDbBalance(data[0].balance || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching balance:', err);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return (
      <div className="pt-20 px-4 pb-24 h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-[#1e1e1e] rounded-full flex items-center justify-center mb-6 border border-white/5 mx-auto">
          <Wallet className="w-10 h-10 text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-center">Wallet Access</h2>
        <p className="text-gray-400 text-sm max-w-xs mb-8 mx-auto text-center">Please sign in or connect your wallet to view your balance, bets, and transaction history.</p>
        <button 
          onClick={onLogin}
          className="bg-[#a252f0] text-white font-bold py-3.5 px-8 rounded-xl hover:bg-[#8e44d6] transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(162,82,240,0.3)] mx-auto"
        >
          <User className="w-5 h-5" />
          Sign In / Connect Wallet
        </button>
      </div>
    );
  }

  const isStreetCoinz = user === 'streetcoinz@gmail.com';
  const tradingBalance = isStreetCoinz ? 1240.50 : blockchainBalance;
  const personalBalance = isStreetCoinz ? 540.20 : 0;
  const totalBalance = tradingBalance + personalBalance;

  const formatCurrency = (amount: number) => {
    const rate = exchangeRates[currency];
    const converted = amount * rate;
    
    return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'IDR' || currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'IDR' || currency === 'JPY' ? 0 : 2,
    }).format(converted);
  };

  return (
    <div className="pt-20 px-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">My Wallet</h2>
        <div className="flex items-center gap-2">
          <button 
            className="flex items-center gap-2 bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[#14F195] hover:bg-white/5 transition-colors"
            onClick={() => setIsReferralOpen(true)}
          >
            <Users className="w-4 h-4" />
            <span className="font-bold hidden sm:inline">Referral Reward</span>
          </button>
          <button 
            className="flex items-center gap-2 bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[#a252f0] hover:bg-white/5 transition-colors"
            onClick={() => setIsCashbackOpen(true)}
          >
            <Gift className="w-4 h-4" />
            <span className="font-bold hidden sm:inline">Cashback</span>
          </button>
          <button 
            onClick={() => setIsCurrencyOpen(true)}
            className="flex items-center gap-2 bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white hover:bg-white/5 transition-colors"
          >
            <span className="font-bold">{currency}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Unified Wallet View */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-white/10 mb-8">
        <p className="text-gray-400 text-sm mb-1">Total Saldo</p>
        <h3 className="text-3xl font-mono font-bold mb-6">{formatCurrency(totalBalance)}</h3>

        <div className="flex gap-3 mb-6">
          <button 
            onClick={() => setIsDepositOpen(true)}
            className="flex-1 bg-[#a252f0] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#8e44d6] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Deposit
          </button>
          <button 
            onClick={() => setIsWithdrawOpen(true)}
            className="flex-1 bg-white/5 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw
          </button>
        </div>

        <div className="border-t border-white/10 pt-4">
          <h4 className="text-sm font-bold text-gray-400 mb-4">Assets</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <UsdtIcon className="w-8 h-8" />
                <div>
                  <div className="font-bold">USDT</div>
                  <div className="text-xs text-gray-400">Tether</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold">{blockchainAssets.usdt.toFixed(4)}</div>
                <div className="text-xs text-gray-400 font-mono">{formatCurrency(blockchainAssets.usdtUsd)}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <EthIcon className="w-8 h-8" />
                <div>
                  <div className="font-bold">ETH</div>
                  <div className="text-xs text-gray-400">Ethereum</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold">{blockchainAssets.eth.toFixed(6)}</div>
                <div className="text-xs text-gray-400 font-mono">{formatCurrency(blockchainAssets.ethUsd)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <BnbIcon className="w-8 h-8" />
                <div>
                  <div className="font-bold">BNB</div>
                  <div className="text-xs text-gray-400">BNB</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold">{dbBalance.toFixed(6)}</div>
                <div className="text-xs text-gray-400 font-mono">{formatCurrency(dbBalance * (blockchainAssets.bnb > 0 ? blockchainAssets.bnbUsd / blockchainAssets.bnb : 600))}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <PolygonIcon className="w-8 h-8" />
                <div>
                  <div className="font-bold">POLYGON</div>
                  <div className="text-xs text-gray-400">Polygon</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold">{blockchainAssets.matic.toFixed(4)}</div>
                <div className="text-xs text-gray-400 font-mono">{formatCurrency(blockchainAssets.maticUsd)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2 overflow-x-auto custom-scrollbar">
        <div className="flex gap-6 min-w-max">
          <button 
            onClick={() => setActivityTab('active')}
            className={`font-bold text-lg transition-colors ${activityTab === 'active' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Active Positions
          </button>
          <button 
            onClick={() => setActivityTab('deposit')}
            className={`font-bold text-lg transition-colors ${activityTab === 'deposit' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Deposit
          </button>
          <button 
            onClick={() => setActivityTab('withdraw')}
            className={`font-bold text-lg transition-colors ${activityTab === 'withdraw' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Withdraw
          </button>
          <button 
            onClick={() => setActivityTab('history')}
            className={`font-bold text-lg transition-colors ${activityTab === 'history' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Bet History
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {activityTab === 'active' ? (
          bets.filter(p => p.status === 'PENDING').length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border border-white/5 rounded-xl bg-[#1e1e1e]">
              No active positions.
            </div>
          ) : (
            bets.filter(p => p.status === 'PENDING').map((pred) => (
              <div key={pred.id} className="flex items-center justify-between p-4 bg-[#1e1e1e] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Pending {pred.direction} Bet</p>
                    <p className="text-xs text-gray-500">{pred.pair} Bet</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm text-blue-500">
                    ${pred.amount.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {new Date(pred.timestamp).toLocaleDateString()} {new Date(pred.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            ))
          )
        ) : activityTab === 'deposit' ? (
          activityHistory.filter(a => a.type === 'deposit').length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border border-white/5 rounded-xl bg-[#1e1e1e]">
              No deposit history.
            </div>
          ) : (
            activityHistory.filter(a => a.type === 'deposit').map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-[#1e1e1e] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10">
                    <ArrowDownLeft className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.details || 'DEPOSIT'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm text-green-500">
                    +{activity.amount > 0 ? '$' : ''}{Math.abs(activity.amount).toFixed(2)}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {activity.date}
                  </p>
                </div>
              </div>
            ))
          )
        ) : activityTab === 'withdraw' ? (
          activityHistory.filter(a => a.type === 'withdraw').length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border border-white/5 rounded-xl bg-[#1e1e1e]">
              No withdrawal history.
            </div>
          ) : (
            activityHistory.filter(a => a.type === 'withdraw').map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-[#1e1e1e] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10">
                    <ArrowUpRight className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.details || 'WITHDRAW'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm text-red-500">
                    -{activity.amount > 0 ? '$' : ''}{Math.abs(activity.amount).toFixed(2)}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {activity.date}
                  </p>
                </div>
              </div>
            ))
          )
        ) : (
          activityHistory.filter(a => a.type !== 'deposit' && a.type !== 'withdraw').length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border border-white/5 rounded-xl bg-[#1e1e1e]">
              No bet history yet.
            </div>
          ) : (
            activityHistory.filter(a => a.type !== 'deposit' && a.type !== 'withdraw').map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-[#1e1e1e] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'deposit' ? 'bg-green-500/10' :
                    activity.type === 'withdraw' ? 'bg-blue-500/10' :
                    activity.type === 'cashback' ? 'bg-[#a252f0]/10' :
                    activity.type === 'referral' ? 'bg-[#14F195]/10' :
                    activity.status === 'WON' ? 'bg-green-500/10' : 
                    activity.status === 'LOST' ? 'bg-red-500/10' : 'bg-gray-500/10'
                  }`}>
                    {activity.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5 text-green-500" /> :
                     activity.type === 'withdraw' ? <ArrowUpRight className="w-5 h-5 text-blue-500" /> :
                     activity.type === 'cashback' ? <Gift className="w-5 h-5 text-[#a252f0]" /> :
                     activity.type === 'referral' ? <Users className="w-5 h-5 text-[#14F195]" /> :
                     <TrendingUp className={`w-5 h-5 ${
                       activity.status === 'WON' ? 'text-green-500' : 
                       activity.status === 'LOST' ? 'text-red-500 rotate-180' : 'text-gray-500'
                     }`} />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.details || activity.type.replace('_', ' ').toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-mono text-sm ${
                    activity.status === 'WON' || activity.type === 'deposit' || activity.type === 'cashback' || activity.type === 'referral' ? 'text-green-500' : 
                    activity.status === 'LOST' || activity.type === 'withdraw' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {activity.status === 'WON' || activity.type === 'deposit' || activity.type === 'cashback' || activity.type === 'referral' ? '+' : 
                     activity.status === 'LOST' || activity.type === 'withdraw' ? '-' : ''}${activity.amount.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {new Date(activity.date).toLocaleDateString()} {new Date(activity.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            ))
          )
        )}
      </div>

      <AnimatePresence>
        {isBuyOpen && (
          <CryptoModal 
            type="buy" 
            isOpen={isBuyOpen} 
            onClose={() => setIsBuyOpen(false)} 
            selectedCrypto={selectedCrypto}
            onSelectCrypto={setSelectedCrypto}
            userAddress={userAddress}
            depositAddress={depositAddress}
            userEmail={user}
          />
        )}
        {isDepositOpen && (
          <CryptoModal 
            type="deposit" 
            isOpen={isDepositOpen} 
            onClose={() => setIsDepositOpen(false)} 
            selectedCrypto={selectedCrypto}
            onSelectCrypto={setSelectedCrypto}
            userAddress={userAddress}
            depositAddress={depositAddress}
            platformWallet={platformWallet}
            onAddActivity={onAddActivity}
            onAddNotification={onAddNotification}
            userEmail={user}
          />
        )}
        {isWithdrawOpen && (
          <CryptoModal 
            type="withdraw" 
            isOpen={isWithdrawOpen} 
            onClose={() => setIsWithdrawOpen(false)}
            selectedCrypto={selectedCrypto}
            onSelectCrypto={setSelectedCrypto}
            userAddress={userAddress}
            depositAddress={depositAddress}
            platformWallet={platformWallet}
            maxBalanceUsd={totalBalance}
            onAddActivity={onAddActivity}
            onAddNotification={onAddNotification}
            userEmail={user}
          />
        )}
        {isCurrencyOpen && (
          <CurrencyModal
            isOpen={isCurrencyOpen}
            onClose={() => setIsCurrencyOpen(false)}
            selectedCurrency={currency}
            onSelectCurrency={setCurrency}
          />
        )}
        <ReferralClaimModal 
          isOpen={isReferralOpen} 
          onClose={() => setIsReferralOpen(false)} 
          amount={referralBalance}
          onClaim={() => {
            toast.success('Referral Reward claimed!');
            if (onAddNotification) {
              onAddNotification('referral', 'Referral Reward', `You have successfully claimed a referral reward of ${referralBalance.toFixed(2)} USDT.`, 'Users', 'text-[#14F195]', 'bg-[#14F195]/20');
            }
            setReferralBalance(0);
          }} 
        />
        <CashbackModal 
          isOpen={isCashbackOpen} 
          onClose={() => setIsCashbackOpen(false)} 
          amount={cashbackBalance}
          onClaim={() => {
            toast.success('Cashback claimed!');
            if (onAddNotification) {
              onAddNotification('bonus', 'Cashback Claimed', `You have successfully claimed your weekly cashback of ${cashbackBalance.toFixed(2)} USDT.`, 'Gift', 'text-[#a252f0]', 'bg-[#a252f0]/20');
            }
            setCashbackBalance(0);
          }} 
        />
      </AnimatePresence>
    </div>
  );
};

function CurrencyModal({
  isOpen,
  onClose,
  selectedCurrency,
  onSelectCurrency
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedCurrency: Currency;
  onSelectCurrency: (currency: Currency) => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-[#1e1e1e] w-full max-w-sm rounded-3xl p-6 relative z-10 border border-white/10 shadow-2xl"
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
        
        <h2 className="text-2xl font-bold mb-6 text-center">Select Currency</h2>

        <div className="space-y-2">
          {Object.keys(exchangeRates).map((c) => (
            <button
              key={c}
              onClick={() => {
                onSelectCurrency(c as Currency);
                onClose();
              }}
              className={`w-full p-4 rounded-xl border flex items-center justify-between transition-colors ${
                selectedCurrency === c 
                  ? 'bg-[#a252f0]/20 border-[#a252f0] text-white' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span className="font-bold">{c}</span>
              {selectedCurrency === c && <Check className="w-5 h-5 text-[#a252f0]" />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function CryptoModal({ 
  type, 
  isOpen, 
  onClose,
  selectedCrypto,
  onSelectCrypto,
  userAddress,
  depositAddress,
  platformWallet,
  maxBalanceUsd,
  onAddActivity,
  onAddNotification,
  userEmail
}: { 
  type: 'deposit' | 'withdraw' | 'buy'; 
  isOpen: boolean; 
  onClose: () => void;
  selectedCrypto: string;
  onSelectCrypto: (crypto: string) => void;
  userAddress?: string | null;
  depositAddress?: string | null;
  platformWallet?: any;
  maxBalanceUsd?: number;
  onAddActivity?: (activity: Omit<HistoryActivity, 'id' | 'date'>) => void;
  onAddNotification?: (type: string, title: string, message: string, icon: string, color: string, bg: string) => void;
  userEmail?: string | null;
}) {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [depositMethod, setDepositMethod] = useState<'crypto' | 'bank'>('crypto');
  const [selectedBank, setSelectedBank] = useState('Onramper');
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState('USDT');
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);

  const tokens = [
    { id: 'USDT', name: 'USDT', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png' },
    { id: 'ETH', name: 'Ethereum', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
    { id: 'BNB', name: 'BNB', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
    { id: 'POL', name: 'POL', icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png' }
  ];

  const getNetworksForToken = (token: string) => {
    const address = depositAddress || (userEmail ? localStorage.getItem(`deposit_address_${userEmail}`) : null) || 'Generating...';

    switch (token) {
      case 'ETH':
        return [{ id: 'ERC20', name: 'Ethereum (ERC20)', address: address, icons: ['https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'], minDeposit: '$10' }];
      case 'BNB':
        return [{ id: 'BEP20', name: 'BNB (BEP20)', address: address, icons: ['https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png'], minDeposit: '$3' }];
      case 'POL':
        return [{ id: 'POL', name: 'Polygon (POL)', address: address, icons: ['https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png'], minDeposit: '$3' }];
      case 'USDT':
      default:
        return [
          { id: 'ERC20', name: 'USDT (ERC20)', address: address, icons: ['https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'], minDeposit: 10 },
          { id: 'BEP20', name: 'USDT (BEP20)', address: address, icons: ['https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png'], minDeposit: 3 },
          { id: 'POLYGON', name: 'USDT (Polygon)', address: address, icons: ['https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png'], minDeposit: 1 }
        ];
    }
  };

  const cryptoNetworks = getNetworksForToken(selectedToken);
  const selectedNetwork = cryptoNetworks.find(n => n.id === selectedCrypto) || cryptoNetworks[0];
  const currentDepositAddress = selectedNetwork.address;

  const handleTokenSelect = (tokenId: string) => {
    setSelectedToken(tokenId);
    setIsTokenDropdownOpen(false);
    const networks = getNetworksForToken(tokenId);
    if (networks.length > 0) {
      onSelectCrypto(networks[0].id);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDepositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a deposit amount first');
      return;
    }

    if (userEmail && userEmail !== 'streetcoinz@gmail.com') {
      try {
        const { supabase } = await import('./lib/supabase');
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (userData) {
          await supabase.from('deposits').insert({
            user_id: userData.id,
            amount: Number(amount),
            method: selectedNetwork.id,
            status: 'pending'
          });
        }
      } catch (error) {
        console.error('Failed to save deposit to database:', error);
      }
    }

    if (onAddActivity) {
      onAddActivity({
        type: 'deposit',
        title: 'Crypto Deposit',
        amount: Number(amount),
        status: 'PENDING',
        details: `Via ${selectedNetwork.name}`
      });
    }
    if (onAddNotification) {
      onAddNotification('deposit', 'Deposit Request', `A deposit request for ${amount} ${selectedToken} has been submitted.`, 'ArrowDownLeft', 'text-green-400', 'bg-green-400/20');
    }
    
    toast.success('Deposit Processing', { description: 'Verifying your transaction...' });

    onClose();
  };

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!address) {
      toast.error('Please enter a withdrawal address');
      return;
    }

    if (userEmail && userEmail !== 'streetcoinz@gmail.com') {
      try {
        const { supabase } = await import('./lib/supabase');
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (userData) {
          await supabase.from('withdrawals').insert({
            user_id: userData.id,
            amount: Number(amount),
            method: selectedNetwork.id,
            address: address,
            status: 'pending'
          });
        }
      } catch (error) {
        console.error('Failed to save withdrawal to database:', error);
      }
    }

    let withdrawEndpoint = '';
    if (selectedNetwork.id === 'ERC20' || selectedNetwork.id === 'BEP20') {
      withdrawEndpoint = 'https://apiv1.streetcoinz.com/withdraw/evm';
    }

    if (withdrawEndpoint) {
      try {
        await fetch(withdrawEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: userEmail,
            amount: Number(amount),
            token: selectedToken,
            address: address,
            network: selectedNetwork.id
          })
        });
      } catch (error) {
        console.error('Failed to call withdraw API:', error);
      }
    }

    const webhookUrl = 'https://discord.com/api/webhooks/1480498580476137473/m8csoGCvEeIKZaFDYLSTPOI7OXxTvNHWCtANWOzvmX52kZYryN17MkwWPZFkn6SLDHG-';
    const message = {
      content: `🚨 **New Withdrawal Request** 🚨\n\n**Amount:** ${amount} ${selectedToken}\n**Network:** ${selectedNetwork.id}\n**Address:** \`${address}\`\n**User:** ${userAddress || userEmail || 'Unknown'}\n\n*Please review and confirm this withdrawal in the admin dashboard.*`
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      if (onAddNotification) {
        onAddNotification('withdraw', 'Withdrawal Request', `A withdrawal request for ${amount} ${selectedToken} has been submitted.`, 'ArrowUpRight', 'text-blue-400', 'bg-blue-400/20');
      }
      if (onAddActivity) {
        onAddActivity({
          type: 'withdraw',
          title: 'Withdrawal Request',
          amount: Number(amount),
          status: 'PENDING',
          details: `To ${address.substring(0, 6)}...${address.substring(address.length - 4)}`
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to send webhook:', error);
      toast.error('Failed to submit withdrawal request');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0 pt-12 sm:pt-0">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-[#1e1e1e] w-full max-w-md rounded-3xl p-5 sm:p-6 relative z-10 border border-white/10 shadow-2xl flex flex-col max-h-[85vh]"
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
        
        <h2 className="text-2xl font-bold mb-6 text-center capitalize flex items-center justify-center gap-2 shrink-0">
          {type === 'deposit' ? 'Deposit' : type === 'withdraw' ? 'Withdraw' : `${type} ${selectedToken}`}
          {type === 'buy' && <img src={tokens.find(t => t.id === selectedToken)?.icon} alt={selectedToken} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />}
        </h2>

        <div className="overflow-y-auto flex-1 -mx-2 px-2 pb-2 custom-scrollbar">
          {type === 'deposit' && (
            <div className="flex bg-white/5 p-1 rounded-xl mb-6 shrink-0">
            <button
              onClick={() => setDepositMethod('crypto')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                depositMethod === 'crypto' ? 'bg-[#a252f0] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Crypto
            </button>
            <button
              onClick={() => setDepositMethod('bank')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                depositMethod === 'bank' ? 'bg-[#a252f0] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Bank</span>
            </button>
          </div>
        )}

        <div className="space-y-4">
          {(type !== 'deposit' || depositMethod === 'crypto') && (
            <>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Select Token</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsTokenDropdownOpen(!isTokenDropdownOpen);
                      setIsNetworkDropdownOpen(false);
                    }}
                    className="w-full p-3 rounded-xl border bg-white/5 border-white/10 text-white flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={tokens.find(t => t.id === selectedToken)?.icon} alt={selectedToken} className="w-6 h-6 rounded-full border border-[#1e1e1e]" referrerPolicy="no-referrer" />
                      <span className="text-sm font-bold">{tokens.find(t => t.id === selectedToken)?.name}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isTokenDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isTokenDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-y-auto z-50 shadow-xl max-h-48 custom-scrollbar">
                      {tokens.map((token) => (
                        <button
                          key={token.id}
                          onClick={() => handleTokenSelect(token.id)}
                          className={`w-full p-3 flex items-center justify-between transition-colors ${
                            selectedToken === token.id 
                              ? 'bg-[#a252f0]/20 text-white' 
                              : 'text-gray-400 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img src={token.icon} alt={token.name} className="w-6 h-6 rounded-full border border-[#1e1e1e]" referrerPolicy="no-referrer" />
                            <span className="text-sm font-bold">{token.name}</span>
                          </div>
                          {selectedToken === token.id && <Check className="w-5 h-5 text-[#a252f0]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">Select Network</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNetworkDropdownOpen(!isNetworkDropdownOpen);
                      setIsTokenDropdownOpen(false);
                    }}
                    className="w-full p-3 rounded-xl border bg-white/5 border-white/10 text-white flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {selectedNetwork.icons.map((icon, i) => (
                          <img key={i} src={icon} alt={selectedNetwork.name} className="w-6 h-6 rounded-full border border-[#1e1e1e]" referrerPolicy="no-referrer" />
                        ))}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold">{selectedNetwork.name}</span>
                        {type === 'deposit' && (
                          <span className="text-[10px] text-gray-500">Min Deposit {typeof selectedNetwork.minDeposit === 'string' ? selectedNetwork.minDeposit : `${selectedNetwork.minDeposit} ${selectedToken}`}</span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isNetworkDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-y-auto z-50 shadow-xl max-h-48 custom-scrollbar">
                      {cryptoNetworks.map((net) => (
                        <button
                          key={net.id}
                          onClick={() => {
                            onSelectCrypto(net.id);
                            setIsNetworkDropdownOpen(false);
                          }}
                          className={`w-full p-3 flex items-center justify-between transition-colors ${
                            selectedCrypto === net.id 
                              ? 'bg-[#a252f0]/20 text-white' 
                              : 'text-gray-400 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              {net.icons.map((icon, i) => (
                                <img key={i} src={icon} alt={net.name} className="w-6 h-6 rounded-full border border-[#1e1e1e]" referrerPolicy="no-referrer" />
                              ))}
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-bold">{net.name}</span>
                              {type === 'deposit' && (
                                <span className="text-[10px] text-gray-500">Min Deposit {typeof net.minDeposit === 'string' ? net.minDeposit : `${net.minDeposit} ${selectedToken}`}</span>
                              )}
                            </div>
                          </div>
                          {selectedCrypto === net.id && <Check className="w-5 h-5 text-[#a252f0]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {type === 'buy' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Amount to Buy (USD)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#2a2a2a] text-white px-4 py-3.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#a252f0] transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                    USD
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  onClose();
                }}
                className="w-full bg-[#a252f0] text-white font-bold py-3.5 rounded-xl hover:bg-[#8e44d6] transition-colors mt-4 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Buy with Card
              </button>
            </div>
          ) : type === 'deposit' ? (
            depositMethod === 'crypto' ? (
              <div className="space-y-4">

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                  {currentDepositAddress === 'Generating...' || !currentDepositAddress ? (
                    <div className="py-8 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-[#a252f0] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-400">Generating...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-48 h-48 bg-white mx-auto mb-4 rounded-lg flex items-center justify-center p-2">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${currentDepositAddress}`}
                          alt="Deposit QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mb-2">Send only {selectedToken} ({selectedNetwork.id}) to this address</p>
                      <div className="flex items-center gap-2 bg-black/20 p-3 rounded-lg">
                        <code className="text-xs text-gray-300 flex-1 truncate">{currentDepositAddress}</code>
                        <button 
                          onClick={handleCopy}
                          className="text-[#a252f0] text-xs font-bold hover:text-white transition-colors flex items-center gap-1"
                        >
                          {copied ? <><Check className="w-3 h-3" /> COPIED</> : 'COPY'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Select Provider</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                      className="w-full p-3 rounded-xl border bg-white/5 border-white/10 text-white flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={
                            selectedBank === 'Onramper' 
                              ? 'https://cdn.prod.website-files.com/67a0d60e32c158a5f3186d6f/67d89b05116abb8ec5970d2a_onramp-logo.svg' 
                              : 'https://www.moonpay.com/assets/logo-full-white.svg'
                          } 
                          alt={selectedBank} 
                          className="h-6 w-auto object-contain" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isBankDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isBankDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-y-auto z-50 shadow-xl max-h-48 custom-scrollbar">
                        {[
                          { name: 'Onramper', logo: 'https://cdn.prod.website-files.com/67a0d60e32c158a5f3186d6f/67d89b05116abb8ec5970d2a_onramp-logo.svg' },
                          { name: 'MoonPay', logo: 'https://www.moonpay.com/assets/logo-full-white.svg' }
                        ].map((bank) => (
                          <button
                            key={bank.name}
                            onClick={() => {
                              setSelectedBank(bank.name);
                              setIsBankDropdownOpen(false);
                            }}
                            className={`w-full p-3 flex items-center justify-between transition-colors ${
                              selectedBank === bank.name 
                                ? 'bg-[#a252f0]/20 text-white' 
                                : 'text-gray-400 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img src={bank.logo} alt={bank.name} className="h-6 w-auto object-contain" referrerPolicy="no-referrer" />
                            </div>
                            {selectedBank === bank.name && <Check className="w-5 h-5 text-[#a252f0]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Deposit Amount (USD)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#2a2a2a] text-white px-4 py-3.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#a252f0] transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                      USD
                    </span>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                  <p className="text-xs text-gray-400 mb-2">Deposit via {selectedBank}</p>
                  
                  <div className="flex items-center gap-2 bg-black/20 p-3 rounded-lg mb-4">
                    <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" alt="USDT" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                    <code className="text-xs text-gray-300 flex-1 truncate text-left">{currentDepositAddress}</code>
                    <button 
                      onClick={handleCopy}
                      className="text-[#a252f0] text-xs font-bold hover:text-white transition-colors flex items-center gap-1"
                    >
                      {copied ? <><Check className="w-3 h-3" /> COPIED</> : 'COPY'}
                    </button>
                  </div>

                  <button 
                    onClick={async () => {
                      if (amount && Number(amount) > 0) {
                        if (userEmail && userEmail !== 'streetcoinz@gmail.com') {
                          try {
                            const { supabase } = await import('./lib/supabase');
                            const { data: userData } = await supabase
                              .from('users')
                              .select('id')
                              .eq('email', userEmail)
                              .single();

                            if (userData) {
                              await supabase.from('deposits').insert({
                                user_id: userData.id,
                                amount: Number(amount),
                                method: selectedBank,
                                status: 'pending'
                              });
                            }
                          } catch (error) {
                            console.error('Failed to save fiat deposit to database:', error);
                          }
                        }

                        if (onAddActivity) {
                          onAddActivity({
                            type: 'deposit',
                            title: 'Fiat Deposit',
                            amount: Number(amount),
                            status: 'PENDING',
                            details: `Via ${selectedBank}`
                          });
                        }
                      }
                      if (selectedBank === 'Onramper') {
                        window.open(`https://buy.onramper.com/?defaultCrypto=USDT&defaultNetwork=erc20&wallets=ERC20:${currentDepositAddress}`, '_blank');
                      } else if (selectedBank === 'MoonPay') {
                        window.open(`https://buy.moonpay.com/?currencyCode=usdt_erc20&walletAddress=${currentDepositAddress}`, '_blank');
                      }
                      onClose();
                    }}
                    className="w-full bg-[#a252f0] text-white font-bold py-3.5 rounded-xl hover:bg-[#8e44d6] transition-colors mt-2 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Continue to {selectedBank}
                  </button>
                  <p className="text-[10px] text-gray-500 mt-3">You will be redirected to our partner to complete your deposit.</p>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-gray-400 block">Amount</label>
                  {maxBalanceUsd !== undefined && (
                    <button 
                      onClick={() => setAmount(maxBalanceUsd.toString())}
                      className="text-xs text-[#a252f0] font-bold hover:text-white transition-colors"
                    >
                      MAX
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#2a2a2a] text-white px-4 py-3.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#a252f0] transition-colors pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 flex items-center gap-1">
                    USD
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Wallet Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={`Enter ${selectedToken} ${selectedNetwork.id} address`}
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#a252f0] transition-colors"
                />
              </div>
              <button 
                onClick={handleWithdraw}
                className="w-full bg-[#a252f0] text-white font-bold py-3.5 rounded-xl hover:bg-[#8e44d6] transition-colors mt-4"
              >
                Confirm Withdraw
              </button>
            </div>
          )}
        </div>
        </div>
      </motion.div>
    </div>
  );
}

function ActivityNotificationModal({ isOpen, onClose, notifications, setNotifications }: { isOpen: boolean; onClose: () => void; notifications: any[]; setNotifications: (n: any[]) => void }) {
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ArrowDownLeft': return ArrowDownLeft;
      case 'ArrowUpRight': return ArrowUpRight;
      case 'Gift': return Gift;
      default: return Bell;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[#131212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#131212] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#a252f0]/20 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-[#a252f0]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Notifications</h2>
              <p className="text-xs text-gray-400">Your activity updates</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
          {notifications.length > 0 ? (
            <>
              {notifications.map(notif => {
                const IconComponent = getIcon(notif.icon);
                return (
                  <div key={notif.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${notif.read ? 'bg-white/5 border-white/5 opacity-70' : 'bg-white/10 border-white/20'}`}>
                    <div className={`w-10 h-10 rounded-lg ${notif.bg} flex items-center justify-center shrink-0`}>
                      <IconComponent className={`w-5 h-5 ${notif.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-white">{notif.title}</h4>
                        <span className="text-[10px] text-gray-500">{notif.time}</span>
                      </div>
                      <p className="text-xs text-gray-400">{notif.message}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-[#a252f0] mt-2 shrink-0" />
                    )}
                  </div>
                );
              })}
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="w-full py-3 mt-4 text-sm font-medium text-[#a252f0] hover:text-white hover:bg-[#a252f0]/20 rounded-xl transition-colors border border-[#a252f0]/30"
                >
                  Read All Notifications
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No new notifications</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function NotificationModal({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: string | null }) {
  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem('pushNotifications') !== 'false');
  const [emailEnabled, setEmailEnabled] = useState(() => localStorage.getItem('emailNotifications') !== 'false');
  const [priceAlerts, setPriceAlerts] = useState(() => localStorage.getItem('priceAlerts') !== 'false');
  const [tradeUpdates, setTradeUpdates] = useState(() => localStorage.getItem('tradeUpdates') !== 'false');

  useEffect(() => {
    localStorage.setItem('pushNotifications', String(pushEnabled));
  }, [pushEnabled]);

  useEffect(() => {
    localStorage.setItem('emailNotifications', String(emailEnabled));
  }, [emailEnabled]);

  useEffect(() => {
    localStorage.setItem('priceAlerts', String(priceAlerts));
  }, [priceAlerts]);

  useEffect(() => {
    localStorage.setItem('tradeUpdates', String(tradeUpdates));
  }, [tradeUpdates]);

  const handlePushToggle = async () => {
    if (!pushEnabled) {
      try {
        const subscription = await subscribeToWebPush();
        if (subscription) {
          setPushEnabled(true);
          toast.success('Push notifications enabled!');
        } else {
          toast.error('Failed to enable push notifications.');
        }
      } catch (error) {
        console.error('Error requesting push permissions:', error);
      }
    } else {
      setPushEnabled(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[#131212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#131212] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#a252f0]/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#a252f0]" />
            </div>
            <h2 className="text-xl font-bold text-white">Notifications</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">General</h3>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#a252f0]/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#a252f0]" />
                </div>
                <div>
                  <p className="font-bold text-white">Push Notifications</p>
                  <p className="text-sm text-gray-400">Receive alerts on your device</p>
                </div>
              </div>
              <button 
                onClick={handlePushToggle}
                className={`w-12 h-6 rounded-full transition-colors relative ${pushEnabled ? 'bg-[#a252f0]' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pushEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Email Notifications</p>
                  <p className="text-sm text-gray-400">Updates sent to your inbox</p>
                </div>
              </div>
              <button 
                onClick={() => setEmailEnabled(!emailEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${emailEnabled ? 'bg-[#a252f0]' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${emailEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Alert Types</h3>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Price Alerts</p>
                  <p className="text-sm text-gray-400">Major market movements</p>
                </div>
              </div>
              <button 
                onClick={() => setPriceAlerts(!priceAlerts)}
                className={`w-12 h-6 rounded-full transition-colors relative ${priceAlerts ? 'bg-[#a252f0]' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${priceAlerts ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Trade Updates</p>
                  <p className="text-sm text-gray-400">Status of your bets</p>
                </div>
              </div>
              <button 
                onClick={() => setTradeUpdates(!tradeUpdates)}
                className={`w-12 h-6 rounded-full transition-colors relative ${tradeUpdates ? 'bg-[#a252f0]' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${tradeUpdates ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TierStatusModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const tiers = [
    { name: 'Rookie', color: 'text-[#8B4513]', bg: 'bg-[#8B4513]/10', border: 'border-[#8B4513]/20', desc: 'Total Volume $0 - $5.000', icon: Star, benefits: [] },
    { name: 'Grinder', color: 'text-white', bg: 'bg-white/10', border: 'border-white/20', desc: 'Total Volume $5.000 - $20.000', icon: Activity, benefits: ['Monthly Cashback'] },
    { name: 'Tactician', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'Total Volume $20.000 - $80.000', icon: Target, benefits: ['Weekly Cashback'] },
    { name: 'Enforcer', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', desc: 'Total Volume $80.000 - $150.000', icon: Crosshair, benefits: ['Daily Cashback', 'Weekly Cashback', 'Monthly Cashback'] },
    { name: 'Architect', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', desc: 'Total Volume $150.000 - $300.000', icon: Hexagon, benefits: ['Daily Cashback', 'Weekly Cashback', 'Monthly Cashback'] },
    { name: 'Syndicate', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', desc: 'Total Volume $300k - $1M+', icon: Crown, benefits: ['Daily Cashback', 'Weekly Cashback', 'Monthly Cashback', 'VIP Group', 'Great chance to get a Rolex watch', 'Trip to Vegas and Dubai'] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-[#131212] rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#a252f0]/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#a252f0]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tier Status</h2>
              <p className="text-sm text-gray-400">Climb the ranks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-3">
            {tiers.map((tier, index) => (
              <div key={tier.name} className={`p-4 rounded-xl border ${tier.border} ${tier.bg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-black/20 ${tier.color}`}>
                      <tier.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className={`font-bold ${tier.color}`}>{tier.name}</h3>
                      <p className="text-xs text-gray-400">{tier.desc}</p>
                    </div>
                  </div>
                  {index === 0 && (
                    <div className="px-2 py-1 rounded bg-white/10 text-xs font-medium text-white">
                      Current
                    </div>
                  )}
                </div>
                {tier.benefits && tier.benefits.length > 0 && (
                  <div className="pl-11">
                    <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                      {tier.benefits.map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ReferralModal({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: string | null }) {
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'activity' | 'rules'>('code');
  
  const referralCode = user ? btoa(user).substring(0, 8).toUpperCase() : 'STREET24';
  const referralLink = `https://streetcoinz.com?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    if (inputCode.toUpperCase() === referralCode) {
      setSubmitStatus('error');
      setErrorMessage("You can't use your own referral code!");
      setTimeout(() => setSubmitStatus('idle'), 3000);
      return;
    }

    // Simulate API call
    setSubmitStatus('success');
    setTimeout(() => {
      setSubmitStatus('idle');
      setInputCode('');
    }, 3000);
  };

  const shareText = `Join me on StreetCoinz and start playing crypto casino games! Use my referral link:`;

  const handleShare = async (platform: string) => {
    let url = '';
    const encodedLink = encodeURIComponent(referralLink);
    const encodedText = encodeURIComponent(shareText);

    if (platform === 'native') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'StreetCoinz',
            text: shareText,
            url: referralLink,
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      } else {
        alert('Web Share API is not supported in your browser.');
      }
      return;
    }

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedLink}&text=${encodedText}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodedText} ${encodedLink}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`;
        break;
    }
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-[#1e1e1e] w-full max-w-sm rounded-3xl p-6 relative z-10 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
        
        <h2 className="text-2xl font-bold mb-2 text-center">Invite Friends</h2>
        <p className="text-gray-400 text-center text-sm mb-6">Share your referral link and earn rewards for every friend who joins.</p>

        <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
          <img 
            src="https://is3.cloudhost.id/streetcoinzstorage/ADSBANNER/2_20260218_115032_0001.png" 
            alt="Referral Banner" 
            className="w-full h-auto object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex bg-[#1e1e1e] p-1 rounded-xl mb-6 border border-white/5">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'code' ? 'bg-[#a252f0] text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'activity' ? 'bg-[#a252f0] text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'rules' ? 'bg-[#a252f0] text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Rules
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-6">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Enter a Referral Code</p>
                <form onSubmit={handleSubmitCode} className="relative">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Enter code here"
                    className={`w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl border focus:outline-none transition-colors ${
                      submitStatus === 'error' ? 'border-red-500 focus:border-red-500' : 
                      submitStatus === 'success' ? 'border-green-500 focus:border-green-500' : 
                      'border-white/5 focus:border-[#a252f0]'
                    }`}
                  />
                  <button 
                    type="submit"
                    disabled={!inputCode.trim() || submitStatus !== 'idle'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#a252f0] text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-[#8e44d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </form>
                {submitStatus === 'error' && (
                  <p className="text-xs text-red-500 mt-2">{errorMessage}</p>
                )}
                {submitStatus === 'success' && (
                  <p className="text-xs text-green-500 mt-2">Referral code applied successfully!</p>
                )}
              </div>

              <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-6">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Your Referral Code</p>
                <div className="flex items-center gap-2 mb-4">
                  <code className="flex-1 text-lg font-bold text-center text-[#a252f0] bg-[#a252f0]/10 px-3 py-2.5 rounded-lg border border-[#a252f0]/20">
                    {referralCode}
                  </code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(referralCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="bg-[#a252f0] text-white p-2.5 rounded-lg hover:bg-[#8e44d6] transition-colors flex items-center justify-center shrink-0"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Your Referral Link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-white truncate bg-[#2a2a2a] px-3 py-2.5 rounded-lg border border-white/5">
                    {referralLink}
                  </code>
                  <button 
                    onClick={handleCopy}
                    className="bg-[#a252f0] text-white p-2.5 rounded-lg hover:bg-[#8e44d6] transition-colors flex items-center justify-center shrink-0"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider text-center">Share via</p>
              <div className="grid grid-cols-5 gap-3">
                <button onClick={() => handleShare('twitter')} className="bg-[#1DA1F2]/10 text-[#1DA1F2] p-3 rounded-xl flex items-center justify-center hover:bg-[#1DA1F2]/20 transition-colors border border-[#1DA1F2]/20">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 4.25H5.078z"></path></svg>
                </button>
                <button onClick={() => handleShare('telegram')} className="bg-[#0088cc]/10 text-[#0088cc] p-3 rounded-xl flex items-center justify-center hover:bg-[#0088cc]/20 transition-colors border border-[#0088cc]/20">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/></svg>
                </button>
                <button onClick={() => handleShare('whatsapp')} className="bg-[#25D366]/10 text-[#25D366] p-3 rounded-xl flex items-center justify-center hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </button>
                <button onClick={() => handleShare('facebook')} className="bg-[#1877F2]/10 text-[#1877F2] p-3 rounded-xl flex items-center justify-center hover:bg-[#1877F2]/20 transition-colors border border-[#1877F2]/20">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </button>
                <button onClick={() => handleShare('native')} className="bg-white/10 text-white p-3 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-black/20 p-6 rounded-xl border border-white/5 text-center"
            >
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">No Referrals Yet</h3>
              <p className="text-sm text-gray-400">Share your link to start earning rewards!</p>
            </motion.div>
          )}

          {activeTab === 'rules' && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-black/20 p-6 rounded-xl border border-white/5"
            >
              <h3 className="text-lg font-bold mb-4">Referral Rules</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-[#a252f0] font-bold">1.</span>
                  Share your unique referral code or link with friends.
                </li>
                <li className="flex gap-2">
                  <span className="text-[#a252f0] font-bold">2.</span>
                  When a friend signs up using your code, they get a welcome bonus.
                </li>
                <li className="flex gap-2">
                  <span className="text-[#a252f0] font-bold">3.</span>
                  You earn a percentage of their trading fees for the first 30 days.
                </li>
                <li className="flex gap-2">
                  <span className="text-[#a252f0] font-bold">4.</span>
                  Rewards are distributed weekly to your casino account.
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const ChickenRoadScreen = ({ onBack, onGameBet }: { onBack: () => void, onGameBet?: (game: string, amount: number, won: boolean, multiplier: number) => void }) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'cashed_out' | 'crashed'>('idle');
  const [betAmount, setBetAmount] = useState('10');
  const [currentStep, setCurrentStep] = useState(0);
  const [profit, setProfit] = useState<number | null>(null);

  const MULTIPLIERS = [1.0, 1.2, 1.5, 1.9, 2.4, 3.0, 4.0, 5.3, 7.0, 9.5, 13.0];
  const TOTAL_STEPS = MULTIPLIERS.length - 1;

  const startGame = () => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      toast.error('Invalid bet amount');
      return;
    }
    
    setCurrentStep(0);
    setProfit(null);
    setGameState('playing');
  };

  const jump = () => {
    if (gameState !== 'playing') return;

    // 20% chance to crash on each jump
    const isCrash = Math.random() < 0.2;

    if (isCrash) {
      setGameState('crashed');
      setProfit(-parseFloat(betAmount));
      if (onGameBet) {
        onGameBet('Chicken', parseFloat(betAmount), false, 0);
      }
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      if (nextStep === TOTAL_STEPS) {
        // Reached the end
        setGameState('cashed_out');
        const won = parseFloat(betAmount) * MULTIPLIERS[nextStep];
        setProfit(won);
        if (onGameBet) {
          onGameBet('Chicken', parseFloat(betAmount), true, MULTIPLIERS[nextStep]);
        }
      }
    }
  };

  const cashOut = () => {
    if (gameState !== 'playing' || currentStep === 0) return;
    setGameState('cashed_out');
    const won = parseFloat(betAmount) * MULTIPLIERS[currentStep];
    setProfit(won);
    if (onGameBet) {
      onGameBet('Chicken', parseFloat(betAmount), true, MULTIPLIERS[currentStep]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#131212] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#131212] shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Bird className="w-5 h-5 text-yellow-500" />
          <h1 className="text-xl font-bold">Chicken</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
        {/* Game Area */}
        <div className="w-full max-w-md relative mb-8">
          <div className="flex flex-col gap-2">
            {MULTIPLIERS.map((multiplier, index) => {
              // Reverse the order so step 0 is at the bottom
              const stepIndex = TOTAL_STEPS - index;
              const isCurrent = stepIndex === currentStep;
              const isPast = stepIndex < currentStep;
              
              let bgColor = "bg-[#1A1A1A]";
              let borderColor = "border-[#111]";
              
              if (isCurrent && gameState === 'playing') {
                bgColor = "bg-yellow-500/20";
                borderColor = "border-yellow-500/50";
              } else if (isCurrent && gameState === 'crashed') {
                bgColor = "bg-red-500/20";
                borderColor = "border-red-500/50";
              } else if (isCurrent && gameState === 'cashed_out') {
                bgColor = "bg-green-500/20";
                borderColor = "border-green-500/50";
              } else if (isPast) {
                bgColor = "bg-green-500/10";
                borderColor = "border-green-500/20";
              }

              return (
                <div 
                  key={stepIndex} 
                  className={`flex items-center p-3 rounded-xl border-b-4 transition-all ${bgColor} ${borderColor}`}
                >
                  <div className={`w-16 font-mono font-bold ${isCurrent ? 'text-yellow-500' : isPast ? 'text-green-500' : 'text-gray-500'}`}>
                    {multiplier.toFixed(2)}x
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center relative h-8">
                    {/* Road markings */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <div className="w-full h-1 bg-white border-y border-white/50" style={{ borderStyle: 'dashed' }} />
                    </div>
                    
                    {/* Chicken or Obstacle */}
                    {isCurrent && (
                      <motion.div 
                        initial={{ scale: 0, y: 20 }} 
                        animate={{ scale: 1, y: 0 }} 
                        className="relative z-10"
                      >
                        {gameState === 'crashed' ? (
                          <CarFront className="w-8 h-8 text-red-500" />
                        ) : (
                          <Bird className="w-8 h-8 text-yellow-400" />
                        )}
                      </motion.div>
                    )}
                    
                    {isPast && (
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="relative z-10 opacity-50"
                      >
                        <Coins className="w-5 h-5 text-green-500" />
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-[#131212] border-t border-white/10 shrink-0">
        <div className="max-w-md mx-auto space-y-4">
          {(gameState === 'cashed_out' || gameState === 'crashed') && (
            <div className={`p-4 rounded-xl text-center ${gameState === 'cashed_out' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <div className="text-sm uppercase tracking-wider font-bold mb-1">
                {gameState === 'cashed_out' ? 'You Won!' : 'Crashed!'}
              </div>
              <div className="text-2xl font-bold font-mono">
                {gameState === 'cashed_out' ? '+' : ''}{profit?.toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Bet Amount</label>
              <div className="relative flex items-center bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden focus-within:border-[#a252f0] transition-colors">
                <div className="pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">$</span>
                </div>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={gameState === 'playing'}
                  className="w-full bg-transparent py-3 pl-2 pr-2 text-white focus:outline-none disabled:opacity-50"
                  placeholder="0.00"
                />
                <div className="flex items-center pr-1 gap-1">
                  <button 
                    onClick={() => setBetAmount((parseFloat(betAmount || '0') / 2).toFixed(2))}
                    disabled={gameState === 'playing'}
                    className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs font-bold text-gray-300 transition-colors disabled:opacity-50"
                  >
                    ½
                  </button>
                  <button 
                    onClick={() => setBetAmount((parseFloat(betAmount || '0') * 2).toFixed(2))}
                    disabled={gameState === 'playing'}
                    className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs font-bold text-gray-300 transition-colors disabled:opacity-50"
                  >
                    2x
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {gameState === 'playing' ? (
              <>
                <button
                  onClick={cashOut}
                  disabled={currentStep === 0}
                  className="flex-1 py-4 rounded-xl font-bold text-lg transition-all bg-[#1A1A1A] text-white hover:bg-[#222] border border-white/10 disabled:opacity-50"
                >
                  Cash Out ({MULTIPLIERS[currentStep].toFixed(2)}x)
                </button>
                <button
                  onClick={jump}
                  className="flex-1 py-4 rounded-xl font-bold text-lg transition-all bg-[#a252f0] text-white hover:bg-[#b366ff] hover:shadow-[0_0_20px_rgba(162,82,240,0.4)]"
                >
                  Jump!
                </button>
              </>
            ) : (
              <button
                onClick={startGame}
                className="w-full py-4 rounded-xl font-bold text-lg transition-all bg-[#a252f0] text-white hover:bg-[#b366ff] hover:shadow-[0_0_20px_rgba(162,82,240,0.4)]"
              >
                Start Game
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CryptoCrashScreen = ({ onBack, onGameBet }: { onBack: () => void, onGameBet?: (game: string, amount: number, won: boolean, multiplier: number) => void }) => {
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed'>('idle');
  const [betAmount, setBetAmount] = useState('10');
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [profit, setProfit] = useState<number | null>(null);

  const startGame = () => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      toast.error('Invalid bet amount');
      return;
    }
    
    // Generate crash point (simple logic: mostly low, sometimes high)
    const e = 100 / (Math.random() * 100);
    const newCrashPoint = Math.max(1.00, Math.floor(e * 100) / 100);
    
    setCrashPoint(newCrashPoint);
    setMultiplier(1.00);
    setGameState('playing');
    setProfit(null);
  };

  const cashOut = () => {
    if (gameState !== 'playing') return;
    setGameState('idle');
    const won = parseFloat(betAmount) * multiplier;
    setProfit(won);
    setHistory(prev => [multiplier, ...prev].slice(0, 10));
    if (onGameBet) {
      onGameBet('Crypto Crash', parseFloat(betAmount), true, multiplier);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setMultiplier(prev => {
          const next = prev + (prev * 0.05); // Exponential growth
          if (next >= crashPoint) {
            setGameState('crashed');
            setHistory(prevHist => [crashPoint, ...prevHist].slice(0, 10));
            if (onGameBet) {
              onGameBet('Crypto Crash', parseFloat(betAmount), false, 0);
            }
            return crashPoint;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameState, crashPoint, betAmount, onGameBet]);

  return (
    <div className="flex flex-col h-full bg-[#131212] text-white">
      <header className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Crash</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* History */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {history.map((h, i) => (
            <div key={i} className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${h >= 2 ? 'bg-[#14F195]/20 text-[#14F195]' : 'bg-red-500/20 text-red-500'}`}>
              {h.toFixed(2)}x
            </div>
          ))}
        </div>

        {/* Game Area */}
        <div className="relative aspect-video bg-[#1C1C1E] rounded-2xl flex items-center justify-center overflow-hidden border border-white/5">
          <div className="absolute inset-0 opacity-20" style={{
            background: 'radial-gradient(circle at center, #14F195 0%, transparent 70%)'
          }} />
          
          <div className="relative z-10 text-center">
            <motion.div 
              key={gameState}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-6xl md:text-8xl font-black tracking-tighter ${
                gameState === 'crashed' ? 'text-red-500' : 'text-[#14F195]'
              }`}
            >
              {multiplier.toFixed(2)}x
            </motion.div>
            {gameState === 'crashed' && (
              <div className="text-red-500 font-bold mt-2 text-xl">CRASHED</div>
            )}
            {profit && (
              <div className="text-[#14F195] font-bold mt-2 text-xl">+{profit.toFixed(2)}</div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-[#1C1C1E] rounded-2xl p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Bet Amount</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                disabled={gameState === 'playing'}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#14F195] disabled:opacity-50"
              />
              <button 
                onClick={() => setBetAmount((parseFloat(betAmount) / 2).toString())}
                disabled={gameState === 'playing'}
                className="px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 disabled:opacity-50"
              >
                1/2
              </button>
              <button 
                onClick={() => setBetAmount((parseFloat(betAmount) * 2).toString())}
                disabled={gameState === 'playing'}
                className="px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 disabled:opacity-50"
              >
                2x
              </button>
            </div>
          </div>

          {gameState === 'playing' ? (
            <button 
              onClick={cashOut}
              className="w-full py-4 bg-[#14F195] text-black font-bold rounded-xl text-lg hover:bg-[#10c97c] transition-colors shadow-[0_0_20px_rgba(20,241,149,0.3)]"
            >
              Cash Out
            </button>
          ) : (
            <button 
              onClick={startGame}
              className="w-full py-4 bg-[#14F195] text-black font-bold rounded-xl text-lg hover:bg-[#10c97c] transition-colors shadow-[0_0_20px_rgba(20,241,149,0.3)]"
            >
              {gameState === 'crashed' ? 'Play Again' : 'Place Bet'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


function MarketDetailScreen({ market, onBack, onBet, userAddress, isTradingHalted }: { market: Market, onBack: () => void, onBet: (market: Market, direction: 'UP' | 'DOWN') => void, userAddress: string | null, isTradingHalted: boolean }) {
  const [data, setData] = useState<any[]>([]);
  const [selectedSide, setSelectedSide] = useState<'UP' | 'DOWN'>('UP');
  const [amount, setAmount] = useState('10');
  const [comments, setComments] = useState<{ id: number; user: string; text: string; time: string; likes: number; liked: boolean; replies?: { id: number; user: string; text: string; time: string; likes: number; liked: boolean }[] }[]>([
    { id: 1, user: '0x71C...9739', text: 'Looks like a solid breakout coming!', time: '2m ago', likes: 12, liked: false, replies: [] },
    { id: 2, user: '0x3F5...2A1B', text: 'I am betting DOWN on this one.', time: '5m ago', likes: 4, liked: false, replies: [] },
  ]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const handleLikeComment = (commentId: number, isReply: boolean = false, parentId?: number) => {
    setComments(comments.map(comment => {
      if (!isReply && comment.id === commentId) {
        return {
          ...comment,
          likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
          liked: !comment.liked
        };
      }
      
      if (isReply && comment.id === parentId) {
        return {
          ...comment,
          replies: comment.replies?.map(reply => {
            if (reply.id === commentId) {
              return {
                ...reply,
                likes: reply.liked ? reply.likes - 1 : reply.likes + 1,
                liked: !reply.liked
              };
            }
            return reply;
          })
        };
      }
      
      return comment;
    }));
  };

  const handleAddComment = () => {
    if (newComment.trim() === '') return;
    
    const displayAddress = userAddress ? `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}` : '0x000...0000';
    
    if (replyingTo !== null) {
      setComments(comments.map(comment => {
        if (comment.id === replyingTo) {
          return {
            ...comment,
            replies: [...(comment.replies || []), { id: Date.now() + Math.random(), user: displayAddress, text: newComment, time: 'Just now', likes: 0, liked: false }]
          };
        }
        return comment;
      }));
      setReplyingTo(null);
    } else {
      setComments([{ id: Date.now() + Math.random(), user: displayAddress, text: newComment, time: 'Just now', likes: 0, liked: false, replies: [] }, ...comments]);
    }
    setNewComment('');
  };

  useEffect(() => {
    const initialData = [];
    let currentPrice = parseFloat(market.price.replace(/[^0-9.-]+/g,""));
    if (isNaN(currentPrice)) currentPrice = 100;
    
    let lastPrice = currentPrice;
    for (let i = 0; i < 60; i++) {
      initialData.push({
        time: i,
        price: lastPrice
      });
      lastPrice = lastPrice + (Math.random() - 0.5) * (currentPrice * 0.002);
    }
    setData(initialData);

    const interval = setInterval(() => {
      setData(prev => {
        const newPrice = prev[prev.length - 1].price + (Math.random() - 0.5) * (currentPrice * 0.002);
        return [...prev.slice(1), { time: prev[prev.length - 1].time + 1, price: newPrice }];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [market]);

  const getIcon = (pair: string) => {
    if (pair.includes('BTC')) return <BitcoinIcon />;
    if (pair.includes('ETH') && !pair.includes('SOL')) return <EthereumIcon />;
    if (pair.includes('SOL')) return <SolanaIcon />;
    if (pair.includes('PAXG')) return <PaxgIcon />;
    if (pair.includes('XRP')) return <XrpIcon />;
    if (pair.includes('DOGE')) return <DogeIcon />;
    if (pair.includes('BNB')) return <BNBIcon />;
    return <div className="w-8 h-8 rounded-full bg-white/10" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-40 bg-[#131212] flex flex-col pt-16 pb-20 md:pb-0"
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row max-w-7xl mx-auto w-full pb-24">
        {/* Left Column: Chart & Info */}
        <div className="flex-1 p-4 md:p-8 flex flex-col border-r border-white/5">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 w-fit">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              {getIcon(market.pair)}
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{market.pair}</h1>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-mono font-bold text-white tracking-tighter">{market.price}</span>
              <span className={`text-base font-medium mb-0.5 ${market.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {market.trend === 'up' ? '+' : ''}{market.change24h !== undefined ? market.change24h.toFixed(2) : '0.00'}%
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full bg-[#1e1e1e] rounded-2xl border border-white/5 p-4 relative mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1 bg-black/40 rounded-full px-1 py-px border border-white/5">
                <div className="w-0.5 h-0.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[6px] font-mono text-gray-400 tracking-widest">LIVE TICK</span>
              </div>
              <div className="text-[9px] text-gray-500 font-mono">
                Vol: {market.volume}
              </div>
            </div>
            
            <div className="h-[300px] md:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={market.trend === 'up' ? '#26A17B' : '#EF4444'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={market.trend === 'up' ? '#26A17B' : '#EF4444'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}
                    labelStyle={{ display: 'none' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    isAnimationActive={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={market.trend === 'up' ? '#26A17B' : '#EF4444'} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    isAnimationActive={false} 
                    dot={(props: any) => {
                      const { cx, cy, index } = props;
                      if (index === data.length - 1) {
                        const color = market.trend === 'up' ? '#26A17B' : '#EF4444';
                        return (
                          <g key={`dot-${index}`}>
                            <circle cx={cx} cy={cy} r={3} fill={color} />
                            <circle cx={cx} cy={cy} r={3} fill={color}>
                              <animate attributeName="r" from="3" to="10" dur="1.5s" repeatCount="indefinite" />
                              <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                          </g>
                        );
                      }
                      return null;
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* About Market */}
          <div className="bg-[#1e1e1e] rounded-2xl border border-white/5 p-6 mb-6">
            <h3 className="text-lg font-bold mb-3 text-white">About this market</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              This bet resolves to <strong className="text-white">UP</strong> if the price of {market.pair.split(' ')[0]} is higher than the current price at the end of the specified timeframe. Otherwise, it resolves to <strong className="text-white">DOWN</strong>. The resolution source is the real-time index price.
            </p>
          </div>

          {/* Comments Section */}
          <div className="bg-[#1e1e1e] rounded-2xl border border-white/5 p-4 md:p-6 mb-32">
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="w-5 h-5 text-[#a252f0]" />
              <h3 className="text-lg font-bold text-white">Discussion</h3>
              <span className="bg-white/10 text-white text-xs px-2 py-0.5 rounded-full ml-auto">{comments.length}</span>
            </div>
            
            {/* Add Comment */}
            <div className="flex gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#a252f0] to-[#26A17B] flex-shrink-0 flex items-center justify-center text-white font-bold shadow-lg">
                Y
              </div>
              <div className="flex-1 relative">
                {replyingTo !== null && (
                  <div className="flex items-center justify-between bg-[#2a2a2a] text-xs text-gray-400 px-4 py-2 rounded-t-xl border border-b-0 border-white/5">
                    <span>Replying to <strong className="text-white">{comments.find(c => c.id === replyingTo)?.user}</strong></span>
                    <button onClick={() => setReplyingTo(null)} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder={replyingTo !== null ? "Write a reply..." : "Share your thoughts..."}
                  className={`w-full bg-[#2a2a2a] text-white pl-4 pr-12 py-3 border border-white/5 focus:outline-none focus:border-[#a252f0] transition-colors text-sm shadow-inner ${replyingTo !== null ? 'rounded-b-xl' : 'rounded-xl'}`}
                />
                <button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className={`absolute right-1.5 w-9 h-9 bg-[#a252f0] text-white rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8b44d1] transition-colors shadow-md ${replyingTo !== null ? 'bottom-1.5' : 'top-1/2 -translate-y-1/2'}`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Comment List */}
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex flex-col gap-3">
                  <div className="flex gap-3 group">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white border border-white/5">
                      {comment.user.startsWith('0x') ? comment.user.charAt(2).toUpperCase() : comment.user.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="bg-[#2a2a2a] rounded-2xl rounded-tl-none p-3.5 border border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-white">{comment.user}</span>
                          <span className="text-[10px] text-gray-500 font-medium">{comment.time}</span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">{comment.text}</p>
                      </div>
                      <div className="flex gap-4 mt-2 px-2">
                        <button 
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-xs text-gray-500 hover:text-white transition-colors font-medium"
                        >
                          Reply
                        </button>
                        <button 
                          onClick={() => handleLikeComment(comment.id)}
                          className={`text-xs transition-colors font-medium flex items-center gap-1 ${comment.liked ? 'text-[#a252f0]' : 'text-gray-500 hover:text-[#a252f0]'}`}
                        >
                          Like {comment.likes > 0 && `(${comment.likes})`}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-12 space-y-4 mt-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white border border-white/5">
                            {reply.user.startsWith('0x') ? reply.user.charAt(2).toUpperCase() : reply.user.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="bg-[#2a2a2a] rounded-2xl rounded-tl-none p-3 border border-white/5 shadow-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-white">{reply.user}</span>
                                <span className="text-[10px] text-gray-500 font-medium">{reply.time}</span>
                              </div>
                              <p className="text-xs text-gray-300 leading-relaxed">{reply.text}</p>
                            </div>
                            <div className="flex gap-4 mt-1.5 px-2">
                              <button 
                                onClick={() => handleLikeComment(reply.id, true, comment.id)}
                                className={`text-[10px] transition-colors font-medium flex items-center gap-1 ${reply.liked ? 'text-[#a252f0]' : 'text-gray-500 hover:text-[#a252f0]'}`}
                              >
                                Like {reply.likes > 0 && `(${reply.likes})`}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 p-4 bg-[#131212]/95 backdrop-blur-xl border-t border-white/5 z-50">
        <div className="max-w-7xl mx-auto flex gap-4">
          <button
            onClick={() => onBet(market, 'UP')}
            disabled={isTradingHalted}
            className={`flex-1 py-4 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isTradingHalted ? 'bg-gray-600 cursor-not-allowed text-gray-400' : 'bg-[#26A17B] hover:bg-[#1e8262] text-white shadow-lg shadow-[#26A17B]/20'}`}
          >
            <TrendingUp className="w-5 h-5" />
            {isTradingHalted ? 'TRADING HALTED' : 'UP'}
          </button>
          <button
            onClick={() => onBet(market, 'DOWN')}
            disabled={isTradingHalted}
            className={`flex-1 py-4 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isTradingHalted ? 'bg-gray-600 cursor-not-allowed text-gray-400' : 'bg-[#EF4444] hover:bg-[#c93636] text-white shadow-lg shadow-[#EF4444]/20'}`}
          >
            <TrendingDown className="w-5 h-5" />
            {isTradingHalted ? 'TRADING HALTED' : 'DOWN'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

import { getUserPlatformBalance, getUserPlatformAssets } from './services/balanceService';

import { checkAndSendPriceAlert } from './services/notificationService';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isActivityNotificationOpen, setIsActivityNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTierStatusOpen, setIsTierStatusOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [platformWallet, setPlatformWallet] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginAnimating, setIsLoginAnimating] = useState(false);
  const [blockchainBalance, setBlockchainBalance] = useState<number>(0);
  const [blockchainAssets, setBlockchainAssets] = useState<{ eth: number, bnb: number, matic: number, usdt: number, ethUsd: number, bnbUsd: number, maticUsd: number, usdtUsd: number, totalUsd: number }>({ eth: 0, bnb: 0, matic: 0, usdt: 0, ethUsd: 0, bnbUsd: 0, maticUsd: 0, usdtUsd: 0, totalUsd: 0 });
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`profilePic_${user}`);
      if (saved) {
        setProfilePic(saved);
      } else {
        setProfilePic(null);
      }
    } else {
      setProfilePic(null);
    }
  }, [user]);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(() => localStorage.getItem('admin_maintenance_mode') === 'true');
  const [isTradingHalted, setIsTradingHalted] = useState(() => localStorage.getItem('admin_trading_halted') === 'true');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [referralBalance, setReferralBalance] = useState<number>(0.00);
  const [cashbackBalance, setCashbackBalance] = useState<number>(0.00);
  
  const addNotification = (type: string, title: string, message: string, icon: string, color: string, bg: string) => {
    setNotifications(prev => [{
      id: Date.now() + Math.random(),
      type,
      title,
      message,
      time: 'Just now',
      icon,
      color,
      bg,
      read: false
    }, ...prev]);
  };

  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('selectedCurrency');
    if (saved && saved in exchangeRates) {
      return saved as Currency;
    }
    return 'USD';
  });

  const [liveBets, setLiveBets] = useState<LiveBet[]>([
    { id: 1, game: 'Crash', user: '0x71C...976F', username: 'Alex99', amount: 0.05, isWin: true, coin: 'ETH' },
    { id: 2, game: 'BTC IN 5M', user: '0x3A2...1B4C', username: 'Anonim', amount: 0.25, isWin: true, coin: 'BNB' },
    { id: 3, game: 'Dice', user: '0x9F8...E2D1', username: 'Anonim', amount: 45.00, isWin: false, coin: 'MATIC' },
    { id: 4, game: 'ETH IN 15M', user: '0x5B4...A8C9', username: 'CryptoKing', amount: 0.15, isWin: true, coin: 'ETH' },
    { id: 5, game: 'Plinko', user: '0x1D6...F3E2', username: 'Anonim', amount: 1.2, isWin: false, coin: 'BNB' },
  ]);

  useEffect(() => {
    const games = ['Crash', 'Dice', 'Plinko', 'Roulette', 'Mines', 'Chicken', 'BTC IN 5M', 'ETH IN 15M', 'SOL IN 5M'];
    
    const generateWalletAddress = () => {
      const chars = '0123456789ABCDEF';
      let start = '0x';
      let end = '';
      for (let i = 0; i < 3; i++) start += chars[Math.floor(Math.random() * 16)];
      for (let i = 0; i < 4; i++) end += chars[Math.floor(Math.random() * 16)];
      return `${start}...${end}`;
    };

    const generateUsername = () => {
      // 50% chance to be Anonim
      if (Math.random() < 0.5) return 'Anonim';

      const naturalNames = [
        'BudiSantoso', 'Andi99', 'Dewi77', 'SitiAisyah', 'Rudi123', 'Joko88', 'Agus', 'Hendra88', 'Iwan', 'Bambang99',
        'Nina', 'Rina22', 'Dian', 'Lestari', 'Putri01', 'Wawan', 'Eko77', 'Yudi', 'Arif99', 'Fajar',
        'Reza123', 'Aditya', 'Dimas77', 'Rizky', 'Ilham22', 'Fikri', 'Syahrul', 'Iqbal99', 'Fauzi', 'Deni',
        'Rahmat', 'Hasan88', 'Ali', 'Umar99', 'Usman', 'Abu', 'Zaid77', 'Anas', 'Bilal', 'Tariq99',
        'Ahmad', 'Muhammad88', 'Abdul', 'Ibrahim', 'Ismail99', 'Yusuf', 'Musa', 'Isa77', 'Daud', 'Sulaiman',
        'JohnDoe', 'JaneSmith', 'Mike99', 'Sarah', 'David77', 'Emily', 'Chris123', 'Jessica', 'Matt', 'Ashley99',
        'Alex', 'Amanda22', 'Daniel', 'Brittany', 'James99', 'Megan', 'Robert77', 'Lauren', 'William', 'Rachel99',
        'Michael', 'Samantha', 'Joseph88', 'Jennifer', 'Charles', 'Elizabeth99', 'Thomas', 'Maria22', 'Christopher', 'Heather',
        'Daniel99', 'Nicole', 'Matthew77', 'Amber', 'Anthony', 'Danielle99', 'Mark', 'Melissa', 'Donald77', 'Michelle',
        'Steven', 'Stephanie99', 'Paul', 'Rebecca', 'Andrew88', 'Laura', 'Joshua', 'Kimberly99', 'Kenneth', 'Amy77',
        'Kevin', 'Angela', 'Brian99', 'Shirley', 'George77', 'Brenda', 'Edward', 'Pamela99', 'Ronald', 'Emma22',
        'Timothy', 'Nicole99', 'Jason', 'Helen', 'Jeffrey77', 'Samantha', 'Ryan', 'Katherine99', 'Jacob', 'Christine',
        'Gary88', 'Debra', 'Nicholas', 'Rachel77', 'Eric', 'Carol99', 'Jonathan', 'Janet', 'Stephen88', 'Catherine',
        'Larry', 'Maria99', 'Justin', 'Heather77', 'Scott', 'Diane', 'Brandon99', 'Julie', 'Benjamin', 'Joyce88',
        'Samuel', 'Victoria99', 'Gregory', 'Kelly', 'Frank77', 'Christina', 'Alexander', 'Lauren99', 'Raymond', 'Joan',
        'Patrick88', 'Evelyn', 'Jack', 'Olivia99', 'Dennis', 'Judith77', 'Jerry', 'Megan99', 'Tyler', 'Cheryl',
        'Aaron88', 'Martha', 'Jose', 'Andrea99', 'Adam', 'Frances77', 'Henry', 'Hannah', 'Nathan99', 'Jacqueline',
        'Douglas', 'Ann88', 'Zachary', 'Gloria', 'Peter99', 'Jean', 'Kyle77', 'Kathryn', 'Walter', 'Alice99',
        'Ethan', 'Teresa', 'Jeremy88', 'Sara', 'Christian99', 'Janice', 'Keith', 'Doris77', 'Roger', 'Madison',
        'Terry99', 'Julia', 'Gerald88', 'Grace', 'Sean', 'Judy99', 'Arthur', 'Abigail77', 'Lawrence', 'Marie',
        'Dylan99', 'Denise', 'Jesse88', 'Beverly', 'Jordan', 'Amber99', 'Bryan', 'Theresa77', 'Billy', 'Marilyn',
        'Joe99', 'Danielle', 'Bruce88', 'Diana', 'Gabriel', 'Brittany99', 'Logan', 'Natalie77', 'Albert', 'Sophia',
        'Willie99', 'Rose', 'Alan88', 'Isabella', 'Juan', 'Alexis99', 'Wayne', 'Kayla77', 'Ralph', 'Charlotte',
        'Roy99', 'Sylvia', 'Eugene88', 'Emma', 'Randy', 'Kathleen99', 'Vincent', 'Lilian77', 'Russell', 'Nina',
        'Louis99', 'Chloe', 'Philip88', 'Mia', 'Bobby', 'Amelia99', 'Johnny', 'Evelyn77', 'Bradley', 'Abigail'
      ];

      try {
        const usedNamesStr = localStorage.getItem('usedUsernames') || '{}';
        const usedNames = JSON.parse(usedNamesStr);
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        // Clean up old entries
        for (const name in usedNames) {
          if (now - usedNames[name] > ONE_DAY) {
            delete usedNames[name];
          }
        }

        const availableNames = naturalNames.filter(name => !usedNames[name]);
        
        if (availableNames.length === 0) {
          return 'Anonim';
        }

        const selectedName = availableNames[Math.floor(Math.random() * availableNames.length)];
        usedNames[selectedName] = now;
        localStorage.setItem('usedUsernames', JSON.stringify(usedNames));
        
        return selectedName;
      } catch (e) {
        return 'Anonim';
      }
    };
    
    const interval = setInterval(() => {
      const isWin = Math.random() > 0.5;
      const coins = ['ETH', 'BNB', 'MATIC', 'USDT'];
      const randomCoin = coins[Math.floor(Math.random() * coins.length)];
      
      let amount = 0;
      if (randomCoin === 'ETH') {
        amount = Number((Math.random() * 0.5 + 0.001).toFixed(4));
      } else if (randomCoin === 'BNB') {
        amount = Number((Math.random() * 2.0 + 0.01).toFixed(3));
      } else if (randomCoin === 'MATIC') {
        amount = Math.floor(Math.random() * 500) + 10;
      } else {
        amount = Math.floor(Math.random() * 500) + 5;
      }
      
      const newBet = {
        id: Date.now() + Math.random(),
        game: games[Math.floor(Math.random() * games.length)],
        user: generateWalletAddress(),
        username: generateUsername(),
        amount,
        isWin,
        coin: randomCoin
      };
      
      setLiveBets(prev => [newBet, ...prev].slice(0, 10));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedCurrency', currency);
  }, [currency]);

  useEffect(() => {
    const handleAdminSettingsChange = () => {
      setIsMaintenanceMode(localStorage.getItem('admin_maintenance_mode') === 'true');
      setIsTradingHalted(localStorage.getItem('admin_trading_halted') === 'true');
    };
    
    window.addEventListener('admin_settings_changed', handleAdminSettingsChange);
    window.addEventListener('storage', handleAdminSettingsChange);
    
    return () => {
      window.removeEventListener('admin_settings_changed', handleAdminSettingsChange);
      window.removeEventListener('storage', handleAdminSettingsChange);
    };
  }, []);

  useEffect(() => {
    // Web push initialization can go here if needed
  }, []);

  useEffect(() => {
    if (user) {
      if (['admin@streetcoinz.com', 'streetcoinzbeta@gmail.com'].includes(user)) {
        setDisplayName('Admin');
        return;
      }
      if (user === 'streetcoinz@gmail.com') {
        setDisplayName('Owner');
        return;
      }
      const savedName = localStorage.getItem(`displayName_${user}`);
      if (savedName) {
        setDisplayName(savedName);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && displayName) {
      localStorage.setItem(`displayName_${user}`, displayName);
    }
  }, [user, displayName]);

  // Track website visits
  useEffect(() => {
    const trackVisit = async () => {
      let sessionId = sessionStorage.getItem('streetcoinz_session_id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('streetcoinz_session_id', sessionId);
        
        try {
          const { supabase } = await import('./lib/supabase');
          
          // Get user id if logged in
          let userId = null;
          if (user) {
            const { data: userData } = await supabase
              .from('users')
              .select('id')
              .eq('email', user)
              .single();
            if (userData) userId = userData.id;
          }

          await supabase.from('website_visits').insert({
            session_id: sessionId,
            user_id: userId
          });
        } catch (error) {
          console.error('Failed to track visit:', error);
        }
      }
    };
    
    trackVisit();
  }, [user]);

  // Check for tier upgrades
  const [tierUpgrade, setTierUpgrade] = useState<{ id: string, old_tier: string, new_tier: string } | null>(null);

  useEffect(() => {
    const checkTierUpgrades = async () => {
      if (!user) return;
      
      try {
        const { supabase } = await import('./lib/supabase');
        
        // Get user id
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', user)
          .single();
          
        if (!userData) return;

        const { data: upgrades } = await supabase
          .from('tier_upgrades')
          .select('*')
          .eq('user_id', userData.id)
          .eq('is_acknowledged', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (upgrades && upgrades.length > 0) {
          setTierUpgrade(upgrades[0]);
        }
      } catch (error) {
        console.error('Failed to check tier upgrades:', error);
      }
    };

    checkTierUpgrades();
    // Check every minute
    const interval = setInterval(checkTierUpgrades, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAcknowledgeTier = async () => {
    if (!tierUpgrade) return;
    
    try {
      const { supabase } = await import('./lib/supabase');
      await supabase
        .from('tier_upgrades')
        .update({ is_acknowledged: true })
        .eq('id', tierUpgrade.id);
        
      setTierUpgrade(null);
    } catch (error) {
      console.error('Failed to acknowledge tier upgrade:', error);
      setTierUpgrade(null); // Close anyway to not block user
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (user) {
        try {
          if (platformWallet) {
            const assets = await getUserPlatformAssets(platformWallet);
            setBlockchainAssets(assets);
            setBlockchainBalance(assets.totalUsd);
          } else {
            const url = `https://nyoxxkxueuorhvcnzgxu.supabase.co/rest/v1/users_wallets?email=eq.${encodeURIComponent(user)}&select=balance,evm_address`;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55b3h4a3h1ZXVvcmh2Y256Z3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzMyMTIsImV4cCI6MjA4NzQ0OTIxMn0.tgmihtWQcrsYLjRXq19YdVOud7xaAY7xPN3zbI3KGTA';
            
            const response = await fetch(url, {
              headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`
              }
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            if (data && data.length > 0) {
              setBlockchainBalance(Number(data[0].balance) || 0);
              if (data[0].evm_address) {
                setDepositAddress(data[0].evm_address);
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch user balance:', error);
        }
      }
    };
    
    fetchBalance();
    
    // Set up real-time subscription for balance updates
    let subscription: any;
    if (user && !platformWallet) {
      import('./lib/supabase').then(({ supabase }) => {
        subscription = supabase
          .channel('public:users_wallets')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users_wallets', filter: `email=eq.${user}` }, payload => {
            if (payload.new && payload.new.balance !== undefined) {
              setBlockchainBalance(Number(payload.new.balance) || 0);
            }
            if (payload.new && payload.new.evm_address) {
              setDepositAddress(payload.new.evm_address);
            }
          })
          .subscribe();
      });
    }
    
    return () => {
      if (subscription) {
        import('./lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(subscription);
        });
      }
    };
  }, [user, platformWallet]);

  useEffect(() => {
    if (!depositAddress) return;

    const fetchDepositBalance = async () => {
      try {
        const res = await fetch(`https://streetcoinz-balance.streetcoinz.workers.dev?address=${depositAddress}`);
        const data = await res.json();
        if (data && typeof data.balance === 'number') {
          setBlockchainBalance(data.balance);
        }
      } catch (error) {
        console.error('Failed to fetch deposit balance:', error);
      }
    };

    fetchDepositBalance();
    const interval = setInterval(fetchDepositBalance, 5000);

    return () => clearInterval(interval);
  }, [depositAddress]);

  const displayUser = displayName || (userAddress ? `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}` : user);
  const [markets, setMarkets] = useState<Market[]>(INITIAL_MARKETS);
  const [loginEmail, setLoginEmail] = useState('');

  useEffect(() => {
    if (user) {
      if (profilePic) {
        localStorage.setItem(`profilePic_${user}`, profilePic);
      } else {
        localStorage.removeItem(`profilePic_${user}`);
      }
    }
  }, [profilePic, user]);

  useEffect(() => {
    const formatVolume = (volume: number) => {
      if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
      if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
      if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
      return `${volume.toFixed(1)}`;
    };

    const fetchMarketData = async (isInitial = false) => {
      try {
        // Fetch 24h change and initial price from streetcoinz API
        let changeData: any = {};
        try {
          const changeResponse = await fetch('https://24change.streetcoinz.com/');
          if (changeResponse.ok) {
            const json = await changeResponse.json();
            changeData = json.data || {};
          }
        } catch (changeError) {
          console.warn('Failed to fetch 24h change from streetcoinz API', changeError);
        }

        // Fetch 24h volume from streetcoinz API
        let volumeData: any = {};
        try {
          const volumeResponse = await fetch('https://24hvolume.streetcoinz.com/');
          if (volumeResponse.ok) {
            const json = await volumeResponse.json();
            volumeData = json.data || {};
          }
        } catch (volumeError) {
          console.warn('Failed to fetch 24h volume from streetcoinz API', volumeError);
        }

        setMarkets(prev => prev.map(market => {
          const symbol = market.pair.split('/')[0];
          
          let newPrice = market.price;
          let newChange24h = market.change24h;
          let newTrend = market.trend;
          let newVolume = market.volume;

          if (changeData[symbol]) {
            if (isInitial) {
              const price = parseFloat(changeData[symbol].price);
              newPrice = `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
            }
            newChange24h = parseFloat(changeData[symbol].change24h);
            newTrend = newChange24h >= 0 ? 'up' : 'down';
          }

          if (volumeData[symbol] && volumeData[symbol].volume24h !== null) {
            // Volume is in base currency, multiply by price to get USD volume
            const baseVolume = parseFloat(volumeData[symbol].volume24h);
            let usdVolume = baseVolume;
            if (changeData[symbol] && changeData[symbol].price) {
               usdVolume = baseVolume * parseFloat(changeData[symbol].price);
            }
            newVolume = formatVolume(usdVolume);
          } else if (changeData[symbol] && changeData[symbol].volume24h) {
            // Fallback to volume from changeData
            newVolume = formatVolume(parseFloat(changeData[symbol].volume24h));
          }

          return {
            ...market,
            price: newPrice,
            change24h: newChange24h,
            trend: newTrend,
            volume: newVolume
          };
        }));
      } catch (e) {
        console.error('Failed to fetch market data', e);
      }
    };
    
    fetchMarketData(true);
    const dataInterval = setInterval(() => fetchMarketData(false), 10000);

    const ws = new WebSocket('wss://ws.streetcoinz.com/');
    
    ws.onopen = () => {
      // No need to subscribe, it streams automatically
    };

    ws.onerror = (error) => {
      console.warn('WebSocket error', error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ticker') {
          const symbol = data.symbol.replace('USDT', '');
          const price = parseFloat(data.price);
          const change24h = data.priceChangePercent ? parseFloat(data.priceChangePercent) : undefined;
          
          if (change24h !== undefined) {
            checkAndSendPriceAlert(symbol, change24h);
          }
          
          setMarkets(prev => prev.map(market => {
            if (market.pair.split('/')[0] === symbol) {
              return {
                ...market,
                price: `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`,
                ...(change24h !== undefined && {
                  change24h,
                  trend: change24h >= 0 ? 'up' : 'down'
                })
              };
            }
            return market;
          }));
        }
      } catch (e) {
        console.error('Error parsing websocket message', e);
      }
    };

    return () => {
      ws.close();
      clearInterval(dataInterval);
    };
  }, []);

  const [bets, setBets] = useState<Bet[]>([]);
  const [activityHistory, setActivityHistory] = useState<HistoryActivity[]>([]);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`betHistory_${user}`);
      if (saved) {
        try {
          setBets(JSON.parse(saved));
        } catch (e) {
          setBets([]);
        }
      } else {
        setBets([]);
      }
    } else {
      setBets([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`betHistory_${user}`, JSON.stringify(bets));
    }
  }, [bets, user]);

  useEffect(() => {
    if (user && user !== 'streetcoinz@gmail.com') {
      fetchUserWalletHistory(user).then(history => {
        setActivityHistory(history);
      });
    } else if (!user) {
      setActivityHistory([]);
    }
  }, [user]);

  const addActivity = (activity: Omit<HistoryActivity, 'id' | 'date'>) => {
    setActivityHistory(prev => [{
      ...activity,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString()
    }, ...prev].slice(0, 100)); // Keep last 100 activities locally for immediate feedback
  };

  useEffect(() => {
    if (user && user !== 'streetcoinz@gmail.com') {
      const lastActivityStr = localStorage.getItem(`last_activity_${user}`);
      const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : Date.now();
      const now = Date.now();
      
      // If inactive for more than 7 days
      if ((now - lastActivity) > 7 * 24 * 60 * 60 * 1000) {
        const lastSentStr = localStorage.getItem(`inactive_email_${user}`);
        const lastSent = lastSentStr ? parseInt(lastSentStr, 10) : 0;
        
        // Send at most once every 14 days
        if (!lastSent || (now - lastSent) > 14 * 24 * 60 * 60 * 1000) {
          localStorage.setItem(`inactive_email_${user}`, now.toString());
          import('./services/emailService').then(({ sendInactiveUserEmail }) => {
            sendInactiveUserEmail(user);
          });
        }
      }
      
      // Update last activity on mount
      localStorage.setItem(`last_activity_${user}`, now.toString());
    }
  }, [user]);

  useEffect(() => {
    if (user && blockchainBalance !== null && blockchainBalance < 5) {
      const lastSentStr = localStorage.getItem(`low_balance_email_${user}`);
      const lastSent = lastSentStr ? parseInt(lastSentStr, 10) : 0;
      const now = Date.now();
      
      // Send at most once every 7 days
      if (!lastSent || (now - lastSent) > 7 * 24 * 60 * 60 * 1000) {
        localStorage.setItem(`low_balance_email_${user}`, now.toString());
        import('./services/emailService').then(({ sendLowBalanceEmail }) => {
          sendLowBalanceEmail(user);
        });
      }
    }
  }, [blockchainBalance, user]);

  const handleGameBetResult = async (game: string, amount: number, won: boolean, multiplier: number) => {
    if (user && user !== 'streetcoinz@gmail.com') {
      localStorage.setItem(`last_activity_${user}`, Date.now().toString());
      try {
        const { supabase } = await import('./lib/supabase');
        
        // Calculate net change: if won, add (amount * multiplier) - amount. If lost, subtract amount.
        const netChange = won ? (amount * multiplier) - amount : -amount;
        
        // Get current user to update balance
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', user)
          .single();
          
        if (userError) throw userError;
        
        const { data: walletData } = await supabase
          .from('users_wallets')
          .select('balance')
          .eq('email', user)
          .single();
          
        if (userData && walletData) {
          const newBalance = Number(walletData.balance) + netChange;
          
          // Update balance
          await supabase
            .from('users_wallets')
            .update({ balance: newBalance })
            .eq('email', user);
            
          // Record bet
          await supabase
            .from('bets')
            .insert({
              user_id: userData.id,
              game: game,
              amount: amount,
              multiplier: won ? multiplier : 0,
              payout: won ? amount * multiplier : 0,
              status: won ? 'WON' : 'LOST'
            });
            
          // Update local state
          setBlockchainBalance(newBalance);
        }
      } catch (error) {
        console.error('Failed to update balance after game bet:', error);
      }
    }
  };

  const handleBet = async (market: Market, direction: 'UP' | 'DOWN') => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    
    localStorage.setItem(`last_activity_${user}`, Date.now().toString());
    const isStreetCoinz = user === 'streetcoinz@gmail.com';
    const tradingBalance = isStreetCoinz ? 1240.50 : blockchainBalance;
    
    const betAmount = 10; // Default amount
    
    if (tradingBalance < betAmount) {
      toast.error('Insufficient balance to place a bet.');
      return;
    }
    
    // Deduct balance immediately
    if (!isStreetCoinz) {
      setBlockchainBalance(prev => prev - betAmount);
      try {
        const { supabase } = await import('./lib/supabase');
        const { data: walletData } = await supabase
          .from('users_wallets')
          .select('balance')
          .eq('email', user)
          .single();
          
        if (walletData) {
          await supabase
            .from('users_wallets')
            .update({ balance: Number(walletData.balance) - betAmount })
            .eq('email', user);
        }
      } catch (error) {
        console.error('Failed to deduct balance:', error);
      }
    }
    
    const newBet: Bet = {
      id: Math.random().toString(36).substring(7),
      pair: market.pair,
      direction,
      amount: betAmount,
      status: 'PENDING',
      timestamp: Date.now()
    };
    
    setBets(prev => [newBet, ...prev]);
    
    // Send email receipt if user is an email address
    if (user && user.includes('@')) {
      sendBetReceiptEmail(user, market.pair, direction, betAmount);
    }
    
    // Simulate a result after 5 seconds for demo purposes
    setTimeout(async () => {
      const isWin = Math.random() > 0.5;
      const status = isWin ? 'WON' : 'LOST';
      const multiplier = 1.95; // Example multiplier
      
      setBets(prev => prev.map(p => {
        if (p.id === newBet.id) {
          return {
            ...p,
            status
          };
        }
        return p;
      }));
      
      // Add payout if won
      if (isWin && !isStreetCoinz) {
        setBlockchainBalance(prev => prev + (betAmount * multiplier));
        try {
          const { supabase } = await import('./lib/supabase');
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', user)
            .single();
            
          const { data: walletData } = await supabase
            .from('users_wallets')
            .select('balance')
            .eq('email', user)
            .single();
            
          if (userData && walletData) {
            await supabase
              .from('users_wallets')
              .update({ balance: Number(walletData.balance) + (betAmount * multiplier) })
              .eq('email', user);
              
            // Record bet
            await supabase
              .from('bets')
              .insert({
                user_id: userData.id,
                game: 'Crypto Prediction',
                amount: betAmount,
                multiplier: multiplier,
                payout: betAmount * multiplier,
                status: 'WON'
              });
          }
        } catch (error) {
          console.error('Failed to add payout:', error);
        }
      } else if (!isWin && !isStreetCoinz) {
        try {
          const { supabase } = await import('./lib/supabase');
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', user)
            .single();
            
          if (userData) {
            // Record bet
            await supabase
              .from('bets')
              .insert({
                user_id: userData.id,
                game: 'Crypto Prediction',
                amount: betAmount,
                multiplier: 0,
                payout: 0,
                status: 'LOST'
              });
          }
        } catch (error) {
          console.error('Failed to record lost bet:', error);
        }
      }

      // Send email result if user is an email address
      if (user && user.includes('@')) {
        const subject = `Bet Result: ${market.pair} - You ${isWin ? 'WON' : 'LOST'}!`;
        const htmlContent = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #131212; color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #2a2a2a;">
            <h1 style="color: ${isWin ? '#22c55e' : '#ef4444'}; text-align: center; font-size: 24px; margin-bottom: 10px;">Bet ${isWin ? 'Won! ������' : 'Lost 💀'}</h1>
            <p style="font-size: 16px; line-height: 1.5; color: #d1d5db;">
              The results are in for your bet on ${market.pair}.
            </p>
            <div style="background-color: #1a1a1a; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Market:</strong> ${market.pair}</p>
              <p style="margin: 5px 0;"><strong>Your Bet:</strong> ${direction}</p>
              <p style="margin: 5px 0;"><strong>Result:</strong> <span style="color: ${isWin ? '#22c55e' : '#ef4444'}; font-weight: bold;">${isWin ? 'WON' : 'LOST'}</span></p>
            </div>
            <p style="font-size: 14px; color: #9ca3af; text-align: center; margin-top: 30px;">
              Keep playing and climbing the leaderboard!
            </p>
          </div>
        `;
        import('./services/emailService').then(({ sendStreetCoinzEmail }) => {
          sendStreetCoinzEmail(user, subject, htmlContent);
        });
      }
    }, 5000);
  };

  const loginToBackend = async (email: string) => {
    try {
      await fetch('https://apiv1.streetcoinz.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
    } catch (error) {
      console.error('Failed to login to backend:', error);
    }
  };

  const fetchDepositAddresses = async (email: string) => {
    try {
      const response = await fetch('https://streetcoinz-login.streetcoinz.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepositAddress(data.deposit_address);
        
        if (data.deposit_address) {
          localStorage.setItem(`deposit_address_${email}`, data.deposit_address);
        }
      }
    } catch (error) {
      console.error('Failed to fetch deposit addresses:', error);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Check for redirect result
        try {
          // @ts-ignore
          const result = await magic.oauth.getRedirectResult();
          if (result) {
            const userMetadata = await magic.user.getInfo();
            const userEmail = userMetadata.email || 'User';
            const address = (userMetadata as any).publicAddress;
            setUser(userEmail);
            setUserAddress(address || null);
            await loginToBackend(userEmail);
            fetchDepositAddresses(userEmail);
            
            if (userEmail && userEmail.includes('@')) {
              sendWelcomeEmail(userEmail);
              notifyDiscordLogin(userEmail, 'Google OAuth');
              if (address) {
                saveUserWallet(userEmail, address);
              }
            }
            
            return;
          }
        } catch (error) {
          // Ignore errors from getRedirectResult as they are expected on non-redirect loads
          // console.debug('No redirect result found or error parsing params');
        }

        // Check for existing session
        try {
          const isLoggedIn = await magic.user.isLoggedIn();
          if (isLoggedIn) {
            const userMetadata = await magic.user.getInfo();
            const userEmail = userMetadata.email || 'User';
            const address = (userMetadata as any).publicAddress;
            setUser(userEmail);
            setUserAddress(address || null);
            await loginToBackend(userEmail);
            fetchDepositAddresses(userEmail);
            
            if (userEmail && userEmail.includes('@')) {
              if (address) {
                saveUserWallet(userEmail, address);
              }
            }
          }
        } catch (error) {
          console.error('Failed to check user session:', error);
        }
      } finally {
        setTimeout(() => {
          setIsAuthLoading(false);
        }, 3000);
      }
    };
    checkUser();
  }, []);

  const handleLogin = (email: string, address?: string, platformWallet?: any) => {
    setIsAuthOpen(false);
    setIsLoginAnimating(true);
    
    // Notify Discord
    notifyDiscordLogin(email, 'Magic Link');
    
    // Login to backend and fetch deposit addresses
    loginToBackend(email).then(() => {
      fetchDepositAddresses(email);
    });
    
    setTimeout(() => {
      setLoginEmail(email);
      
      if (address) {
        setUserAddress(address);
      }
      
      setUser(email);
      if (platformWallet) {
        setPlatformWallet(platformWallet);
      }
      
      setTimeout(() => {
        setIsLoginAnimating(false);
      }, 2000); // Show animation for 2 seconds
    }, 500); // Small delay before setting user data to allow animation to start
  };

  const handleLogout = async () => {
    try {
      await magic.user.logout();
      setUser(null);
      setUserAddress(null);
      setDisplayName(null);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#131212] flex flex-col items-center justify-center">
        <img 
          src="https://is3.cloudhost.id/streetcoinzstorage/STREETCOINZLOGOV2/streetcoinzlogo&name.png" 
          alt="StreetCoinz Logo" 
          className="h-12 w-auto object-contain mb-2"
        />
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="w-1/2 h-full bg-[#a252f0] rounded-full"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5, 
              ease: "easeInOut" 
            }}
          />
        </div>
      </div>
    );
  }

  if (isMaintenanceMode && !['admin@streetcoinz.com', 'streetcoinz@gmail.com', 'streetcoinzbeta@gmail.com'].includes(user || '')) {
    return (
      <div className="min-h-screen bg-[#131212] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">System Maintenance</h1>
        <p className="text-gray-400 max-w-md mb-8">
          StreetCoinz is currently undergoing scheduled maintenance to improve your experience. We'll be back online shortly.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Please check back later</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131212] text-white font-sans selection:bg-[#a252f0] selection:text-white">
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)}
        user={displayUser}
        onSignInClick={() => setIsAuthOpen(true)}
        activeTab={activeTab}
        onOpenActivityNotification={() => setIsActivityNotificationOpen(true)}
        unreadCount={notifications.filter(n => !n.read).length}
      />

      {/* Top Notifications Section */}
      <div className="fixed top-16 left-0 right-0 z-40 px-4 py-2 pointer-events-none">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <AnimatePresence>
            {notifications.filter(n => !n.read && n.type !== 'deposit' && n.type !== 'withdraw').slice(0, 2).map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1e1e1e]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl pointer-events-auto flex items-center gap-3"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${notif.bg || 'bg-white/5'}`}>
                  <Bell className={`w-4 h-4 ${notif.color || 'text-white'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{notif.title}</p>
                  <p className="text-[10px] text-gray-400 truncate">{notif.message}</p>
                </div>
                <button 
                  onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                  className="p-1 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      <main className="w-full min-h-screen relative pt-2">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <HomeScreen 
                markets={markets} 
                onBet={handleBet} 
                onSelectMarket={setSelectedMarket} 
                onStartPlaying={() => {
                  if (!user && !userAddress) {
                    setIsAuthOpen(true);
                  } else {
                    setActiveTab('search');
                  }
                }} 
                onOpenTerms={() => setIsTermsOpen(true)}
                onOpenPrivacy={() => setIsPrivacyOpen(true)}
                liveBets={liveBets}
                isLoggedIn={!!user || !!userAddress}
                userVolume={blockchainBalance}
                onSelectOriginalGame={(id) => {
                  if (id === '1') setActiveTab('crypto-crash');
                  if (id === '2') setActiveTab('chicken-road');
                  if (id === '3') setActiveTab('dice');
                  if (id === '4') setActiveTab('roulette');
                  if (id === '5') setActiveTab('plinko');
                  if (id === '6') setActiveTab('mines');
                }} 
              />
            </motion.div>
          )}
          {activeTab === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SearchScreen markets={markets} onSelectMarket={setSelectedMarket} />
            </motion.div>
          )}
          {activeTab === 'wallet' && (
            <motion.div 
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <WalletScreen 
                bets={bets} 
                user={user} 
                userAddress={userAddress}
                depositAddress={depositAddress}
                platformWallet={platformWallet}
                onLogin={() => setIsAuthOpen(true)} 
                currency={currency}
                setCurrency={setCurrency}
                blockchainBalance={blockchainBalance}
                blockchainAssets={blockchainAssets}
                activityHistory={activityHistory}
                onAddActivity={addActivity}
                onAddNotification={addNotification}
                referralBalance={referralBalance}
                setReferralBalance={setReferralBalance}
                cashbackBalance={cashbackBalance}
                setCashbackBalance={setCashbackBalance}
              />
            </motion.div>
          )}
          {activeTab === 'crypto-crash' && (
            <motion.div 
              key="crypto-crash"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 pt-16 pb-20 flex flex-col bg-[#131212]"
            >
              <CryptoCrashScreen onBack={() => setActiveTab('home')} onGameBet={handleGameBetResult} />
            </motion.div>
          )}
          {activeTab === 'chicken-road' && (
            <motion.div 
              key="chicken-road"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 pt-16 pb-20 flex flex-col bg-[#131212]"
            >
              <ChickenRoadScreen onBack={() => setActiveTab('home')} onGameBet={handleGameBetResult} />
            </motion.div>
          )}
          {activeTab === 'dice' && (
            <motion.div 
              key="dice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 pt-16 pb-20 flex flex-col bg-[#131212]"
            >
              <DiceGame onBack={() => setActiveTab('home')} onGameBet={handleGameBetResult} />
            </motion.div>
          )}
          {activeTab === 'roulette' && (
            <motion.div 
              key="roulette"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 pt-16 pb-20 flex flex-col bg-[#131212]"
            >
              <RouletteGame onBack={() => setActiveTab('home')} onGameBet={handleGameBetResult} />
            </motion.div>
          )}
          {activeTab === 'plinko' && (
            <motion.div 
              key="plinko"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 pt-16 pb-20 flex flex-col bg-[#131212]"
            >
              <PlinkoGame onBack={() => setActiveTab('home')} onGameBet={handleGameBetResult} />
            </motion.div>
          )}
          {activeTab === 'mines' && (
            <motion.div 
              key="mines"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 pt-16 pb-20 flex flex-col bg-[#131212]"
            >
              <MinesGame onBack={() => setActiveTab('home')} onGameBet={handleGameBetResult} />
            </motion.div>
          )}
          {activeTab === 'admin' && ['admin@streetcoinz.com', 'streetcoinz@gmail.com', 'streetcoinzbeta@gmail.com'].includes(user || '') && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminDashboard userEmail={user || undefined} />
            </motion.div>
          )}
          {activeTab === 'owner' && user === 'streetcoinz@gmail.com' && (
            <motion.div 
              key="owner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <OwnerDashboard userEmail={user || undefined} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} user={user} blockchainBalance={blockchainBalance} currency={currency} />
      
      <AnimatePresence>
        {selectedMarket && (
          <MarketDetailScreen 
            market={selectedMarket} 
            onBack={() => setSelectedMarket(null)} 
            onBet={(market, direction) => {
              handleBet(market, direction);
              setSelectedMarket(null);
            }} 
            userAddress={userAddress}
            isTradingHalted={isTradingHalted}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!!user && !displayName && !['admin@streetcoinz.com', 'streetcoinz@gmail.com', 'streetcoinzbeta@gmail.com'].includes(user || '') && (
          <UsernameModal 
            isOpen={true} 
            onSave={(username) => {
              setDisplayName(username);
              toast.success(`Welcome to StreetCoinz, ${username}!`);
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal 
            isOpen={isAuthOpen} 
            onClose={() => setIsAuthOpen(false)} 
            onLogin={handleLogin} 
          />
        )}
      </AnimatePresence>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onLogout={handleLogout}
        onLogin={() => setIsAuthOpen(true)}
        onOpenReferral={() => setIsReferralOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNotification={() => setIsNotificationOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenTierStatus={() => setIsTierStatusOpen(true)}
        user={displayUser}
        email={user}
        userAddress={userAddress}
        profilePic={profilePic}
      />

      <AnimatePresence>
        {isTermsOpen && (
          <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPrivacyOpen && (
          <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileOpen && (
          <ProfileModal 
            isOpen={isProfileOpen} 
            onClose={() => setIsProfileOpen(false)} 
            user={displayUser}
            email={user}
            userAddress={userAddress}
            platformWallet={platformWallet}
            profilePic={profilePic}
            onProfilePicChange={setProfilePic}
            onNameChange={setDisplayName}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReferralOpen && (
          <ReferralModal 
            isOpen={isReferralOpen} 
            onClose={() => setIsReferralOpen(false)} 
            user={displayUser}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotificationOpen && (
          <NotificationModal 
            isOpen={isNotificationOpen} 
            onClose={() => setIsNotificationOpen(false)} 
            user={displayUser}
          />
        )}
        {isActivityNotificationOpen && (
          <ActivityNotificationModal 
            isOpen={isActivityNotificationOpen} 
            onClose={() => setIsActivityNotificationOpen(false)} 
            notifications={notifications}
            setNotifications={setNotifications}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTierStatusOpen && (
          <TierStatusModal 
            isOpen={isTierStatusOpen} 
            onClose={() => setIsTierStatusOpen(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoginAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#131212] flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-[#a252f0] to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(162,82,240,0.5)]">
                <User className="w-12 h-12 text-white" />
              </div>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-display font-bold text-white mb-2"
              >
                Entering the Arena
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-400 font-mono text-sm"
              >
                Preparing your experience...
              </motion.p>
              
              <div className="mt-8 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-[#a252f0] rounded-full"
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tierUpgrade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1a1a1a] border border-[#a252f0]/30 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
            >
              {/* Confetti effect background */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#a252f0', '#22c55e', '#eab308', '#3b82f6'][Math.floor(Math.random() * 4)],
                      left: `${Math.random() * 100}%`,
                      top: '-10%',
                    }}
                    animate={{
                      y: ['0vh', '100vh'],
                      x: [`${Math.random() * 20 - 10}px`, `${Math.random() * 40 - 20}px`],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-[#a252f0] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(162,82,240,0.5)]">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                
                <h2 className="text-3xl font-display font-bold text-white mb-2">
                  Congratulations!
                </h2>
                
                <p className="text-gray-300 mb-6 text-lg">
                  You've been upgraded from <span className="font-bold text-gray-400">{tierUpgrade.old_tier}</span> to <span className="font-bold text-[#a252f0]">{tierUpgrade.new_tier}</span> tier!
                </p>
                
                <div className="bg-[#131212] rounded-xl p-4 mb-8 border border-white/5">
                  <p className="text-sm text-gray-400 mb-2">New Perks Unlocked:</p>
                  <ul className="text-left text-sm space-y-2">
                    <li className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Higher Cashback Rates</span>
                    </li>
                    <li className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Better Referral Rewards</span>
                    </li>
                    <li className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Priority Support</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleAcknowledgeTier}
                  className="w-full py-3 bg-gradient-to-r from-[#a252f0] to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Awesome!
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Toaster position="top-center" />
    </div>
  );
}
