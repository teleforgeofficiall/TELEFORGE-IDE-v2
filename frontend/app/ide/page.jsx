'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import useStore from '@/lib/store';
import { getMe, getFiles, sendChatMessage, writeFile, readFile, updateApiKey } from '@/lib/auth';
import {
  Terminal, MessageSquare, FolderTree, Settings, LogOut,
  ChevronRight, ChevronDown, File, Folder, Plus, X,
  Send, Sparkles, CreditCard, Loader2
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@/components/IDE/Editor'), { ssr: false });

const AVAILABLE_MODELS = [
  { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', provider: 'Anthropic', paidOnly: false },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', paidOnly: false },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic', paidOnly: false },
  { id: 'claude-fable-5', name: 'Claude Fable 5', provider: 'Anthropic', paidOnly: true },
  { id: 'gpt-5.4', name: 'GPT-5.4', provider: 'OpenAI', paidOnly: false },
  { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', provider: 'OpenAI', paidOnly: false },
  { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex', provider: 'OpenAI', paidOnly: false },
];

export default function IDEPage() {
  const router = useRouter();
  const { user, setUser, setFiles, files, openFiles, activeFile, addFile, setActiveFile, closeFile, logout } = useStore();

  const [showFiles, setShowFiles] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6');
  const [apiKey, setApiKey] = useState('');
  const [credits, setCredits] = useState(50);
  const [userPlan, setUserPlan] = useState('free');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [fileTree, setFileTree] = useState([]);
  const [fileContents, setFileContents] = useState({});

  const chatEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadUserData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadUserData = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      setApiKey(userData.api_key || '');
      setCredits(userData.credits);
      setUserPlan(userData.plan);

      const filesData = await getFiles();
      setFiles(filesData.files);
      buildFileTree(filesData.files);
    } catch (err) {
      router.push('/login');
    }
  };

  const buildFileTree = (fileList) => {
    const tree = {};
    fileList.forEach((f) => {
      const parts = f.path.split('/');
      let current = tree;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = { type: f.type, path: f.path };
        } else {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      });
    });
    setFileTree([tree]);
  };

  const renderTree = (node, path = '') => {
    if (!node || typeof node !== 'object') return null;
    return Object.entries(node).map(([name, value]) => {
      const fullPath = path ? `${path}/${name}` : name;
      const isFolder = value && typeof value === 'object' && (value.type === 'folder' || !value.type);
      if (isFolder) {
        const isExpanded = expandedFolders[fullPath];
        return (
          <div key={fullPath}>
            <div
              className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 cursor-pointer text-sm rounded"
              onClick={() => setExpandedFolders({ ...expandedFolders, [fullPath]: !isExpanded })}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Folder className="w-4 h-4 text-pink-400" />
              <span className="text-gray-300">{name}</span>
            </div>
            {isExpanded && (
              <div className="ml-4">
                {renderTree(value, fullPath)}
              </div>
            )}
          </div>
        );
      }
      return (
        <div
          key={fullPath}
          className={`flex items-center gap-1 px-2 py-1 hover:bg-white/5 cursor-pointer text-sm rounded ml-4 ${
            activeFile?.path === fullPath ? 'bg-pink-500/10 text-pink-400' : 'text-gray-400'
          }`}
          onClick={() => openFileInEditor(fullPath)}
        >
          <File className="w-4 h-4" />
          <span>{name}</span>
        </div>
      );
    });
  };

  const openFileInEditor = async (filePath) => {
    try {
      const data = await readFile(filePath);
      setFileContents((prev) => ({ ...prev, [filePath]: data.content }));
      addFile({ path: filePath, name: filePath.split('/').pop() });
    } catch (err) {
      toast.error('Could not read file');
    }
  };

  const handleEditorChange = async (value, filePath) => {
    setFileContents((prev) => ({ ...prev, [filePath]: value }));
    try {
      await writeFile(filePath, value);
    } catch (err) {}
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    if (!apiKey) {
      setShowSettings(true);
      toast.error('Please enter your FreeModel API key in Settings');
      return;
    }

    if (userPlan !== 'pro' && credits <= 0) {
      toast.error('No credits remaining! Buy a plan to continue.');
      return;
    }

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await sendChatMessage(chatInput, selectedModel);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: res.content }]);
      setCredits((prev) => Math.max(0, prev - 1));
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.message || errorData?.error || 'API Error';
      setChatMessages((prev) => [...prev, {
        role: 'error',
        content: `❌ Error: ${errorMessage}`
      }]);
    }
    setChatLoading(false);
  };

  const handleCreateFile = async () => {
    const name = prompt('Enter file name:');
    if (!name) return;
    try {
      await writeFile(name, '');
      toast.success(`Created ${name}`);
      loadUserData();
    } catch (err) {
      toast.error('Failed to create file');
    }
  };

  const handleSaveApiKey = async () => {
    try {
      await updateApiKey(apiKey);
      toast.success('API key saved!');
      setShowSettings(false);
    } catch (err) {
      toast.error('Failed to save API key');
    }
  };

  const getLangFromPath = (path) => {
    const ext = path?.split('.').pop();
    const map = {
      js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
      py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
      sql: 'sql', sh: 'shell', bash: 'shell', yml: 'yaml', yaml: 'yaml',
      xml: 'xml', rs: 'rust', go: 'go', java: 'java', cpp: 'cpp', c: 'c',
      rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin', dart: 'dart',
    };
    return map[ext] || 'plaintext';
  };

  return (
    <div className="h-screen bg-[#0f0f1a] flex flex-col">
      {/* Title Bar */}
      <div className="bg-[#1a1a2e] border-b border-[#2a2a4a] flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-pink-500" />
          <span className="text-sm font-semibold text-white">FreeCode<span className="text-pink-500">AI</span></span>
          <span className="text-xs text-gray-600">|</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-[#16213e] text-xs text-gray-300 border border-[#2a2a4a] rounded px-2 py-1"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id} disabled={m.paidOnly && userPlan !== 'pro'}>
                {m.name} {m.paidOnly && userPlan !== 'pro' ? '(Pro)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {userPlan === 'pro' ? '✨ Unlimited' : `💰 ${credits} req left`}
          </span>
          {userPlan !== 'pro' && (
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs bg-gradient-to-r from-pink-500 to-rose-600 text-white px-3 py-1 rounded font-medium"
            >
              Upgrade
            </button>
          )}
          <button onClick={() => setShowSettings(!showSettings)} className="text-gray-400 hover:text-white">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={() => logout()} className="text-gray-400 hover:text-pink-400">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {showFiles && (
          <div className="w-56 bg-[#1a1a2e] border-r border-[#2a2a4a] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a4a]">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <FolderTree className="w-3 h-3" />
                Files
              </div>
              <button onClick={handleCreateFile} className="text-gray-400 hover:text-pink-400">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto py-1 space-y-0.5 text-xs">
              {fileTree.length > 0 && renderTree(fileTree[0])}
              {files.length === 0 && (
                <div className="text-gray-500 text-xs px-3 py-4 text-center">
                  No files yet.<br />Click + to create one
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {openFiles.length > 0 && (
            <div className="bg-[#1a1a2e] border-b border-[#2a2a4a] flex text-xs overflow-x-auto">
              {openFiles.map((f) => (
                <div
                  key={f.path}
                  className={`flex items-center gap-1 px-3 py-2 cursor-pointer border-r border-[#2a2a4a] ${
                    activeFile?.path === f.path ? 'bg-[#0f0f1a] text-pink-400 border-t-2 border-t-pink-500' : 'text-gray-400 hover:text-gray-200'
                  }`}
                  onClick={() => setActiveFile(f)}
                >
                  <File className="w-3 h-3" />
                  {f.name}
                  <button onClick={(e) => { e.stopPropagation(); closeFile(f.path); }} className="ml-1 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1">
            {activeFile ? (
              <MonacoEditor
                language={getLangFromPath(activeFile.path)}
                value={fileContents[activeFile.path] || ''}
                onChange={(val) => handleEditorChange(val, activeFile.path)}
                path={activeFile.path}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Terminal className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-1">FreeCode AI</p>
                  <p className="text-sm">Open a file or start a new project</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Chat Panel */}
        {showChat && (
          <div className="w-80 bg-[#1a1a2e] border-l border-[#2a2a4a] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a4a]">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <MessageSquare className="w-3 h-3" />
                AI Chat
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span className="text-xs text-gray-500">{selectedModel.split('-').slice(0, 3).join(' ')}</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3 space-y-3 text-sm">
              {chatMessages.length === 0 && (
                <div className="text-gray-500 text-xs text-center py-8">
                  Ask AI to write code, explain concepts, or debug issues.
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-left ${
                    msg.role === 'user'
                      ? 'bg-pink-500/20 text-pink-200'
                      : msg.role === 'error'
                      ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                      : 'bg-[#16213e] text-gray-200'
                  }`}>
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{msg.content}</pre>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-[#2a2a4a]">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask AI anything..."
                  className="flex-1 text-sm py-2 px-3"
                  disabled={chatLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-pink-500 text-white p-2 rounded-lg hover:bg-pink-600 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-[#16213e] border-t border-[#2a2a4a] flex items-center justify-between px-4 py-1 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>{activeFile ? getLangFromPath(activeFile.path) : 'Ready'}</span>
          <span>UTF-8</span>
          {activeFile && <span>Ln 1, Col 1</span>}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowFiles(!showFiles)} className={`hover:text-white ${showFiles ? 'text-pink-400' : ''}`}>
            <FolderTree className="w-3 h-3 inline mr-1" /> Files
          </button>
          <button onClick={() => setShowChat(!showChat)} className={`hover:text-white ${showChat ? 'text-pink-400' : ''}`}>
            <MessageSquare className="w-3 h-3 inline mr-1" /> Chat
          </button>
          <span className="text-pink-400">{userPlan === 'pro' ? '✨ Pro' : `💰 ${credits} credits`}</span>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-8 w-96">
            <h2 className="text-xl font-bold text-white mb-6">Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">FreeModel API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your FreeModel API key"
                  className="w-full text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your key from <a href="https://freemodel.dev/dashboard/keys" target="_blank" rel="noreferrer" className="text-pink-400 hover:underline">freemodel.dev</a>
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-gray-400">
                  Plan: <span className="text-pink-400 capitalize">{userPlan}</span>
                </div>
                {userPlan !== 'pro' && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="text-xs bg-gradient-to-r from-pink-500 to-rose-600 text-white px-3 py-1 rounded font-medium"
                  >
                    <CreditCard className="w-3 h-3 inline mr-1" />
                    Upgrade
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSettings(false)} className="flex-1 border border-[#2a2a4a] text-gray-300 py-2 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={handleSaveApiKey} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600 text-white py-2 rounded-lg text-sm font-semibold">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
