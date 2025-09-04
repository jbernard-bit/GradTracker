import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: 'to-apply' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  resumeId?: string;
  createdAt: any;
  updatedAt: any;
}

interface Resume {
  id: string;
  name: string;
  originalFileName: string;
  uploadDate: any;
}

interface ResumeAnalytics {
  resumeId: string;
  resumeName: string;
  totalApplications: number;
  toApplyCount: number;
  appliedCount: number;
  interviewingCount: number;
  offerCount: number;
  rejectedCount: number;
  applyRate: number;        // to-apply → applied
  interviewRate: number;    // applied → interviewing  
  offerRate: number;        // interviewing → offer
  overallSuccessRate: number; // total offers / total applications
  averageTimeToResponse: number; // days from applied to next stage
}

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#6B7280'];

export default function ResumeInsights() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analytics, setAnalytics] = useState<ResumeAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'applications' | 'success' | 'interview'>('applications');

  useEffect(() => {
    // Fetch applications and resumes
    const unsubscribeApps = onSnapshot(collection(db, 'applications'), (snapshot) => {
      const apps: Application[] = [];
      snapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() } as Application);
      });
      setApplications(apps);
    });

    const unsubscribeResumes = onSnapshot(
      query(collection(db, 'resumes'), orderBy('uploadDate', 'desc')), 
      (snapshot) => {
        const resumeData: Resume[] = [];
        snapshot.forEach((doc) => {
          resumeData.push({ id: doc.id, ...doc.data() } as Resume);
        });
        setResumes(resumeData);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeApps();
      unsubscribeResumes();
    };
  }, []);

  useEffect(() => {
    if (applications.length && resumes.length) {
      calculateAnalytics();
    }
  }, [applications, resumes]);

  const calculateAnalytics = () => {
    const resumeStats: { [key: string]: ResumeAnalytics } = {};

    // Initialize analytics for each resume
    resumes.forEach((resume) => {
      resumeStats[resume.id] = {
        resumeId: resume.id,
        resumeName: resume.name,
        totalApplications: 0,
        toApplyCount: 0,
        appliedCount: 0,
        interviewingCount: 0,
        offerCount: 0,
        rejectedCount: 0,
        applyRate: 0,
        interviewRate: 0,
        offerRate: 0,
        overallSuccessRate: 0,
        averageTimeToResponse: 0
      };
    });

    // Count applications by status for each resume
    applications.forEach((app) => {
      if (app.resumeId && resumeStats[app.resumeId]) {
        const stats = resumeStats[app.resumeId];
        stats.totalApplications++;
        
        switch (app.status) {
          case 'to-apply':
            stats.toApplyCount++;
            break;
          case 'applied':
            stats.appliedCount++;
            break;
          case 'interviewing':
            stats.interviewingCount++;
            break;
          case 'offer':
            stats.offerCount++;
            break;
          case 'rejected':
            stats.rejectedCount++;
            break;
        }
      }
    });

    // Calculate rates for each resume
    Object.values(resumeStats).forEach((stats) => {
      if (stats.totalApplications > 0) {
        // Apply rate: applications that moved from to-apply to applied+ 
        const progressedFromToApply = stats.appliedCount + stats.interviewingCount + stats.offerCount + stats.rejectedCount;
        stats.applyRate = progressedFromToApply / stats.totalApplications * 100;

        // Interview rate: applications that moved from applied to interviewing+
        const appliedTotal = stats.appliedCount + stats.interviewingCount + stats.offerCount + stats.rejectedCount;
        if (appliedTotal > 0) {
          stats.interviewRate = (stats.interviewingCount + stats.offerCount) / appliedTotal * 100;
        }

        // Offer rate: applications that moved from interviewing to offer
        const interviewingTotal = stats.interviewingCount + stats.offerCount;
        if (interviewingTotal > 0) {
          stats.offerRate = stats.offerCount / interviewingTotal * 100;
        }

        // Overall success rate: offers / total applications
        stats.overallSuccessRate = stats.offerCount / stats.totalApplications * 100;
      }
    });

    // Filter out resumes with no applications
    const analyticsData = Object.values(resumeStats).filter(stats => stats.totalApplications > 0);
    setAnalytics(analyticsData);
  };

  const getTopPerformingResume = (): ResumeAnalytics | null => {
    if (analytics.length === 0) return null;
    return analytics.reduce((best, current) => 
      current.overallSuccessRate > best.overallSuccessRate ? current : best
    );
  };

  const getTotalApplications = () => {
    return applications.filter(app => app.resumeId).length;
  };

  const getOverallStats = () => {
    const totalWithResume = applications.filter(app => app.resumeId);
    const offers = totalWithResume.filter(app => app.status === 'offer');
    const interviews = totalWithResume.filter(app => app.status === 'interviewing' || app.status === 'offer');
    const applied = totalWithResume.filter(app => ['applied', 'interviewing', 'offer', 'rejected'].includes(app.status));

    return {
      totalApplications: totalWithResume.length,
      overallSuccessRate: totalWithResume.length > 0 ? (offers.length / totalWithResume.length) * 100 : 0,
      overallInterviewRate: applied.length > 0 ? (interviews.length / applied.length) * 100 : 0,
      averageApplicationsPerResume: analytics.length > 0 ? totalWithResume.length / analytics.length : 0
    };
  };

  const getChartData = () => {
    switch (selectedMetric) {
      case 'applications':
        return analytics.map(stat => ({
          name: stat.resumeName.length > 15 ? stat.resumeName.substring(0, 15) + '...' : stat.resumeName,
          value: stat.totalApplications,
          fullName: stat.resumeName
        }));
      case 'success':
        return analytics.map(stat => ({
          name: stat.resumeName.length > 15 ? stat.resumeName.substring(0, 15) + '...' : stat.resumeName,
          value: Math.round(stat.overallSuccessRate * 10) / 10,
          fullName: stat.resumeName
        }));
      case 'interview':
        return analytics.map(stat => ({
          name: stat.resumeName.length > 15 ? stat.resumeName.substring(0, 15) + '...' : stat.resumeName,
          value: Math.round(stat.interviewRate * 10) / 10,
          fullName: stat.resumeName
        }));
      default:
        return [];
    }
  };

  const getStatusDistribution = () => {
    const total = getTotalApplications();
    if (total === 0) return [];

    const statusCounts = applications.reduce((acc, app) => {
      if (app.resumeId) {
        acc[app.status] = (acc[app.status] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    return [
      { name: 'To Apply', value: statusCounts['to-apply'] || 0, color: COLORS[4] },
      { name: 'Applied', value: statusCounts['applied'] || 0, color: COLORS[0] },
      { name: 'Interviewing', value: statusCounts['interviewing'] || 0, color: COLORS[1] },
      { name: 'Offers', value: statusCounts['offer'] || 0, color: COLORS[2] },
      { name: 'Rejected', value: statusCounts['rejected'] || 0, color: COLORS[3] },
    ].filter(item => item.value > 0);
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];
    const topResume = getTopPerformingResume();
    const overallStats = getOverallStats();

    if (analytics.length === 0) {
      recommendations.push("Start linking your applications to resumes to unlock performance insights.");
      return recommendations;
    }

    if (topResume && analytics.length > 1) {
      recommendations.push(`Your "${topResume.resumeName}" resume has the highest success rate at ${topResume.overallSuccessRate.toFixed(1)}%. Consider using it for more applications.`);
    }

    if (overallStats.overallInterviewRate < 20) {
      recommendations.push("Your interview rate is below 20%. Consider tailoring your resumes more specifically to job requirements.");
    }

    if (overallStats.overallSuccessRate < 5) {
      recommendations.push("Consider updating your resume format or content. Success rates below 5% often indicate room for improvement.");
    }

    const lowPerformingResumes = analytics.filter(stat => stat.totalApplications >= 5 && stat.overallSuccessRate === 0);
    if (lowPerformingResumes.length > 0) {
      recommendations.push(`Consider updating or replacing: ${lowPerformingResumes.map(r => r.resumeName).join(', ')} - they haven't generated any offers yet.`);
    }

    if (recommendations.length === 0) {
      recommendations.push("Great job! Your resume performance looks strong. Keep tracking your applications to identify optimization opportunities.");
    }

    return recommendations;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-100" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-100" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Resume Insights
          </h2>
        </div>
        
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            No Resume Data Yet
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Link your job applications to resumes to unlock performance insights and recommendations.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Edit applications to select which resume you used
          </div>
        </div>
      </div>
    );
  }

  const overallStats = getOverallStats();
  const chartData = getChartData();
  const statusData = getStatusDistribution();
  const recommendations = getRecommendations();
  const topResume = getTopPerformingResume();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Resume Insights
        </h2>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{overallStats.totalApplications}</p>
              <p className="text-sm text-slate-600">Total Applications</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{overallStats.overallSuccessRate.toFixed(1)}%</p>
              <p className="text-sm text-slate-600">Success Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{overallStats.overallInterviewRate.toFixed(1)}%</p>
              <p className="text-sm text-slate-600">Interview Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{overallStats.averageApplicationsPerResume.toFixed(1)}</p>
              <p className="text-sm text-slate-600">Avg per Resume</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resume Performance Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-100" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Resume Performance
            </h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="applications">Applications</option>
              <option value="success">Success Rate (%)</option>
              <option value="interview">Interview Rate (%)</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                fontSize={12}
                stroke="#64748b"
              />
              <YAxis 
                fontSize={12}
                stroke="#64748b"
              />
              <Tooltip 
                formatter={(value: any, name: any, props: any) => [
                  selectedMetric === 'applications' ? value : `${value}%`,
                  selectedMetric === 'applications' ? 'Applications' : 
                  selectedMetric === 'success' ? 'Success Rate' : 'Interview Rate'
                ]}
                labelFormatter={(name: any, payload: any) => {
                  const item = payload?.[0]?.payload;
                  return item?.fullName || name;
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Application Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-100" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Application Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [value, 'Applications']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-slate-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-100" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Detailed Resume Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 font-medium text-slate-700">Resume</th>
                <th className="text-right py-3 px-2 font-medium text-slate-700">Total Apps</th>
                <th className="text-right py-3 px-2 font-medium text-slate-700">Applied</th>
                <th className="text-right py-3 px-2 font-medium text-slate-700">Interviews</th>
                <th className="text-right py-3 px-2 font-medium text-slate-700">Offers</th>
                <th className="text-right py-3 px-2 font-medium text-slate-700">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics
                .sort((a, b) => b.overallSuccessRate - a.overallSuccessRate)
                .map((stat, index) => (
                <tr key={stat.resumeId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {index === 0 && stat.overallSuccessRate > 0 && (
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                      <span className="font-medium text-slate-900">{stat.resumeName}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-slate-700">{stat.totalApplications}</td>
                  <td className="text-right py-3 px-2 text-slate-700">{stat.appliedCount + stat.interviewingCount + stat.offerCount + stat.rejectedCount}</td>
                  <td className="text-right py-3 px-2 text-slate-700">{stat.interviewingCount + stat.offerCount}</td>
                  <td className="text-right py-3 px-2">
                    <span className={`font-medium ${stat.offerCount > 0 ? 'text-green-600' : 'text-slate-700'}`}>
                      {stat.offerCount}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">
                    <span className={`font-medium ${
                      stat.overallSuccessRate >= 10 ? 'text-green-600' :
                      stat.overallSuccessRate >= 5 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {stat.overallSuccessRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Smart Recommendations</h3>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-blue-800 text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}