import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, Firestore } from 'firebase/firestore';
import { BookOpen, CheckSquare, GraduationCap, Users, Settings, LogOut, Plus, Trash2, BookA, ExternalLink, Link as LinkIcon } from 'lucide-react';

declare const __firebase_config: string | undefined;
declare const __app_id: string | undefined;
declare const __initial_auth_token: string | undefined;

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'eng-edu-app';

interface UserProfile {
  id: string;
  name: string;
  role: 'student' | 'admin';
  pin?: string;
  createdAt: string;
}

interface Homework {
  id: string;
  title: string;
  content: string;
  dueDate: string;
  createdAt: string;
}

interface Grade {
  id: string;
  studentId: string;
  examName: string;
  score: string | number;
  date: string;
}

interface AppSettings {
  vocabLink?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [localUserId, setLocalUserId] = useState<string | null>(localStorage.getItem('edu_user_id'));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLogin, setShowLogin] = useState<boolean>(true);
  
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [settings, setSettings] = useState<AppSettings>({});
  const [gradesList, setGradesList] = useState<Grade[]>([]);

  const [activeTab, setActiveTab] = useState<string>('homework');

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    if (localUserId) {
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', localUserId);
      const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          setShowLogin(false);
        } else {
           localStorage.removeItem('edu_user_id');
           setLocalUserId(null);
           setShowLogin(true);
        }
        setLoading(false);
      }, (error) => console.error(error));
      return () => unsubscribeProfile();
    } else {
      setProfile(null);
      setLoading(false);
      setShowLogin(true);
    }
  }, [user, localUserId]);

  useEffect(() => {
    if (!user) return;

    const baseCol = (colName: string) => collection(db, 'artifacts', appId, 'public', 'data', colName);

    const unsubUsers = onSnapshot(baseCol('users'), (snap) => {
      setUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    }, console.error);

    const unsubHomework = onSnapshot(baseCol('homework'), (snap) => {
      const hws = snap.docs.map(d => ({ id: d.id, ...d.data() } as Homework));
      setHomeworkList(hws.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, console.error);

    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      }
    }, console.error);

    const unsubGrades = onSnapshot(baseCol('grades'), (snap) => {
      const grds = snap.docs.map(d => ({ id: d.id, ...d.data() } as Grade));
      setGradesList(grds.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, console.error);

    return () => {
      unsubUsers(); unsubHomework(); unsubSettings(); unsubGrades();
    };
  }, [user]);

  const isAdmin = profile?.role === 'admin';

  const handleLoginSuccess = (userId: string) => {
    localStorage.setItem('edu_user_id', userId);
    setLocalUserId(userId);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('edu_user_id');
    setLocalUserId(null);
    setShowLogin(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  if (!user || showLogin) {
    return <LoginScreen db={db} appId={appId} user={user} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <div className="w-full md:w-64 bg-indigo-900 text-white shadow-xl flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-indigo-800">
          <BookA className="w-8 h-8 text-indigo-300" />
          <h1 className="text-xl font-bold tracking-tight">EduPlatform</h1>
        </div>
        
        <div className="p-4 bg-indigo-950 flex flex-col gap-1">
          <span className="text-sm text-indigo-300">접속 계정</span>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{profile?.name}</span>
            <div className="flex gap-2">
                <span className="text-xs px-2 py-1 bg-indigo-800 rounded-full">{isAdmin ? '관리자' : '학생'}</span>
                <button onClick={handleLogout} className="text-xs text-indigo-400 hover:text-white" title="로그아웃">
                    <LogOut size={14} />
                </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-2 px-3">
          <NavItem icon={<CheckSquare size={20}/>} label="숙제 확인" active={activeTab === 'homework'} onClick={() => setActiveTab('homework')} />
          <NavItem icon={<BookOpen size={20}/>} label="어원 단어장" active={activeTab === 'vocab'} onClick={() => setActiveTab('vocab')} />
          <NavItem icon={<GraduationCap size={20}/>} label="성적 조회" active={activeTab === 'grades'} onClick={() => setActiveTab('grades')} />
          
          {isAdmin && (
            <>
              <div className="my-2 border-t border-indigo-800"></div>
              <p className="px-4 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">관리자 메뉴</p>
              <NavItem icon={<Users size={20}/>} label="학생 관리" active={activeTab === 'admin-users'} onClick={() => setActiveTab('admin-users')} />
              <NavItem icon={<Settings size={20}/>} label="데이터 관리" active={activeTab === 'admin-data'} onClick={() => setActiveTab('admin-data')} />
            </>
          )}
        </nav>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50">
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <h2 className="text-2xl font-bold text-gray-800">
            {activeTab === 'homework' && '오늘의 숙제'}
            {activeTab === 'vocab' && '어원동계어 단어장'}
            {activeTab === 'grades' && '내 성적 조회'}
            {activeTab === 'admin-users' && '학생 관리 (관리자)'}
            {activeTab === 'admin-data' && '데이터 관리 (관리자)'}
          </h2>
        </header>

        <main className="p-8 max-w-6xl mx-auto">
          {activeTab === 'homework' && <StudentHomework list={homeworkList} />}
          {activeTab === 'vocab' && <VocabBook link={settings?.vocabLink} />}
          {activeTab === 'grades' && <StudentGrades list={gradesList} currentUserId={profile?.id} />}
          
          {isAdmin && activeTab === 'admin-users' && <AdminUsers users={usersList} db={db} appId={appId} />}
          {isAdmin && activeTab === 'admin-data' && (
            <AdminData 
              homework={homeworkList} 
              vocabLink={settings?.vocabLink} 
              grades={gradesList} 
              users={usersList.filter(u => u.role !== 'admin')}
              db={db} appId={appId} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active ? 'bg-indigo-800 text-white font-semibold' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface LoginScreenProps {
  db: Firestore;
  appId: string;
  user: User | null;
  onLoginSuccess: (userId: string) => void;
}

function LoginScreen({ db, appId, user, onLoginSuccess }: LoginScreenProps) {
  const [loginMode, setLoginMode] = useState<'student' | 'admin'>('student');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentPin, setStudentPin] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snap) => {
      const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      setStudents(allUsers.filter(u => u.role === 'student'));
    });
    return () => unsub();
  }, [user, db, appId]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
        setErrorMsg("시스템 초기화 중입니다. 잠시 후 다시 시도해주세요.");
        return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (loginMode === 'admin') {
        if (adminPassword === 'admin1234!') {
          const adminRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', 'admin_master');
          await setDoc(adminRef, {
            name: '최고 관리자',
            role: 'admin',
            createdAt: new Date().toISOString()
          }, { merge: true });
          onLoginSuccess('admin_master');
        } else {
          setErrorMsg("관리자 비밀번호가 틀렸습니다. (힌트: admin1234!)");
        }
      } else {
        if (!selectedStudentId) {
           setErrorMsg("이름을 선택해주세요. 목록에 없다면 관리자에게 등록을 요청하세요.");
           setIsSubmitting(false);
           return;
        }
        const student = students.find(s => s.id === selectedStudentId);
        if (student?.pin !== studentPin) {
           setErrorMsg("비밀번호(PIN)가 틀렸습니다.");
           setIsSubmitting(false);
           return;
        }
        onLoginSuccess(selectedStudentId);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookA className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">EduPlatform</h1>
          <p className="text-gray-500 mt-2">영어 학습 관리 시스템에 오신 것을 환영합니다.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => { setLoginMode('student'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${loginMode === 'student' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500'}`}
          >
            학생 로그인
          </button>
          <button
            onClick={() => { setLoginMode('admin'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${loginMode === 'admin' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500'}`}
          >
            관리자 로그인
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {loginMode === 'student' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 선택</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                >
                  <option value="">이름을 선택하세요</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 (PIN)</label>
                <input
                  type="password"
                  required
                  placeholder="숫자 PIN 입력"
                  value={studentPin}
                  onChange={(e) => setStudentPin(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">관리자 비밀번호</label>
              <input
                type="password"
                required
                placeholder="비밀번호 입력"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 mt-6"
          >
            {isSubmitting ? '처리 중...' : (loginMode === 'student' ? '학생으로 접속하기' : '관리자 권한 획득하기')}
          </button>
        </form>
      </div>
    </div>
  );
}

function StudentHomework({ list }: { list: Homework[] }) {
  return (
    <div className="space-y-4">
      {list.length === 0 ? <p className="text-gray-500 text-center py-8">등록된 숙제가 없습니다.</p> : null}
      {list.map(hw => (
        <div key={hw.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{hw.title}</h3>
          <p className="text-sm text-indigo-600 mb-4 font-semibold">마감일: {hw.dueDate}</p>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{hw.content}</p>
        </div>
      ))}
    </div>
  );
}

function VocabBook({ link }: { link?: string }) {
  return (
    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center max-w-2xl mx-auto mt-10">
      <BookA className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
      <h3 className="text-2xl font-bold text-gray-800 mb-2">어원동계어 단어장</h3>
      <p className="text-gray-500 mb-8">선생님이 등록한 외부 학습 사이트(Quizlet, Classcard 등)로 연결됩니다.</p>
      
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
          단어장 학습하러 가기 <ExternalLink size={20} />
        </a>
      ) : (
        <div className="p-4 bg-gray-50 rounded-xl text-gray-500 border border-gray-200">
          아직 선생님이 단어장 링크를 등록하지 않았습니다.
        </div>
      )}
    </div>
  );
}

function StudentGrades({ list, currentUserId }: { list: Grade[], currentUserId?: string }) {
  const myGrades = list.filter(g => g.studentId === currentUserId);
  return (
    <div className="space-y-4">
       {myGrades.length === 0 ? <p className="text-gray-500 text-center py-8">등록된 성적이 없습니다.</p> : null}
       {myGrades.map(g => (
         <div key={g.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
           <div>
             <h3 className="text-lg font-bold text-gray-800">{g.examName}</h3>
             <p className="text-sm text-gray-500 mt-1">응시일: {g.date}</p>
           </div>
           <div className="text-3xl font-black text-indigo-600 bg-indigo-50 px-6 py-3 rounded-xl">{g.score}점</div>
         </div>
       ))}
    </div>
  );
}

interface AdminUsersProps {
  users: UserProfile[];
  db: Firestore;
  appId: string;
}

function AdminUsers({ users, db, appId }: AdminUsersProps) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const students = users.filter(u => u.role === 'student');

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'users'), {
        name,
        pin,
        role: 'student',
        createdAt: new Date().toISOString()
      });
      setName('');
      setPin('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
          <Plus size={20} className="text-indigo-600"/> 신규 학생 등록
        </h3>
        <form onSubmit={handleAddStudent} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">학생 이름</label>
            <input required type="text" placeholder="예: 홍길동" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 (PIN)</label>
            <input required type="text" placeholder="예: 1234" value={pin} onChange={e => setPin(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors h-[50px]">
            학생 등록
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">이름</th>
              <th className="p-4 font-semibold text-gray-600">비밀번호(PIN)</th>
              <th className="p-4 font-semibold text-gray-600">가입일</th>
              <th className="p-4 font-semibold text-gray-600 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">등록된 학생이 없습니다. 먼저 상단에서 학생을 추가해주세요.</td></tr>
            ) : null}
            {students.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-slate-50">
                <td className="p-4 font-medium">{u.name}</td>
                <td className="p-4 text-sm font-mono text-indigo-600">{u.pin}</td>
                <td className="p-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-center">
                   <button onClick={() => handleDelete(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="삭제">
                     <Trash2 size={16}/>
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface AdminDataProps {
  homework: Homework[];
  vocabLink?: string;
  grades: Grade[];
  users: UserProfile[];
  db: Firestore;
  appId: string;
}

function AdminData({ homework, vocabLink, grades, users, db, appId }: AdminDataProps) {
  const [mode, setMode] = useState<'homework' | 'vocab' | 'grades'>('homework');
  
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={() => setMode('homework')} className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${mode === 'homework' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>숙제 관리</button>
        <button onClick={() => setMode('vocab')} className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${mode === 'vocab' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>단어장 관리</button>
        <button onClick={() => setMode('grades')} className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${mode === 'grades' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>성적 관리</button>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        {mode === 'homework' && <HomeworkForm db={db} appId={appId} list={homework} />}
        {mode === 'vocab' && <VocabLinkForm db={db} appId={appId} currentLink={vocabLink} />}
        {mode === 'grades' && <GradeForm db={db} appId={appId} students={users} list={grades} />}
      </div>
    </div>
  );
}

function VocabLinkForm({ db, appId, currentLink }: { db: Firestore, appId: string, currentLink?: string }) {
  const [link, setLink] = useState(currentLink || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLink(currentLink || '');
  }, [currentLink]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), {
        vocabLink: link
      }, { merge: true });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <LinkIcon size={20} className="text-indigo-600"/> 외부 단어장 링크 설정
      </h3>
      <p className="text-sm text-gray-500 mb-6">학생들이 '어원 단어장' 메뉴를 클릭했을 때 이동할 외부 사이트(Quizlet, Classcard 등)의 전체 주소를 입력하세요.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">단어장 URL (주소)</label>
          <input 
            required 
            type="url" 
            placeholder="https://quizlet.com/..." 
            value={link} 
            onChange={e => setLink(e.target.value)} 
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
          />
        </div>
        <div className="flex items-center gap-4">
          <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            링크 저장
          </button>
          {isSaved && <span className="text-indigo-600 font-medium text-sm">✓ 성공적으로 저장되었습니다.</span>}
        </div>
      </form>
    </div>
  );
}

function HomeworkForm({ db, appId, list }: { db: Firestore, appId: string, list: Homework[] }) {
  const [formData, setFormData] = useState({ title: '', content: '', dueDate: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'homework'), {
        ...formData, createdAt: new Date().toISOString()
      });
      setFormData({ title: '', content: '', dueDate: '' });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'homework', id));
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20} className="text-indigo-600"/> 숙제 등록</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="text" placeholder="숙제 제목" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-600" />
          <textarea required placeholder="숙제 상세 내용" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32" />
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2 transition-colors">등록하기</button>
        </form>
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4">숙제 목록 ({list.length})</h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {list.map(hw => (
            <div key={hw.id} className="p-4 bg-slate-50 border border-gray-100 rounded-xl flex justify-between items-start">
              <div>
                <div className="font-bold text-gray-800 mb-1">{hw.title}</div>
                <div className="text-xs text-indigo-600 font-medium">마감: {hw.dueDate}</div>
              </div>
              <button onClick={() => handleDelete(hw.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GradeForm({ db, appId, students, list }: { db: Firestore, appId: string, students: UserProfile[], list: Grade[] }) {
  const [formData, setFormData] = useState({ studentId: '', examName: '', score: '', date: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'grades'), formData);
      setFormData({ studentId: '', examName: '', score: '', date: '' });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'grades', id));
  };

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || '알 수 없음';

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20} className="text-indigo-600"/> 성적 입력</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white">
            <option value="">학생 선택</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input required type="text" placeholder="시험명/과목명" value={formData.examName} onChange={e => setFormData({...formData, examName: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          <div className="flex gap-4">
            <input required type="number" placeholder="점수" value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} className="w-1/2 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-1/2 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-600" />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2 transition-colors">성적 입력</button>
        </form>
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4">최근 입력된 성적</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {list.map(g => (
            <div key={g.id} className="p-4 bg-slate-50 border border-gray-100 rounded-xl flex justify-between items-center">
              <div>
                <span className="font-bold text-indigo-700">{getStudentName(g.studentId)}</span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-sm font-medium text-gray-700">{g.examName} ({g.score}점)</span>
              </div>
              <button onClick={() => handleDelete(g.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}