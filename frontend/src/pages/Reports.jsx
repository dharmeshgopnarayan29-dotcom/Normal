import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';
import { FileBarChart, Download } from 'lucide-react';

const Reports = () => {
    const [issues, setIssues] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('issues/');
                setIssues(res.data);
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, []);

    const total = issues.length;
    const resolved = issues.filter(i => i.status === 'resolved').length;
    const pending = issues.filter(i => i.status === 'pending').length;
    const inProgress = issues.filter(i => i.status === 'in_progress').length;

    // Group by category
    const categoryGroups = {};
    issues.forEach(i => {
        if (!categoryGroups[i.category]) categoryGroups[i.category] = [];
        categoryGroups[i.category].push(i);
    });

    const exportCSV = () => {
        const headers = 'Title,Category,Status,Reporter,Date\n';
        const rows = issues.map(i =>
            `"${i.title}","${i.category}","${i.status}","${i.reporter_name || ''}","${new Date(i.created_at).toLocaleDateString()}"`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'civicfix-report.csv';
        a.click();
    };

    return (
        <div className="dashboard-bg">
            <Navbar />
            <div className="container-wide">
                <div className="flex justify-between items-start mb-6">
                    <div className="page-header !mb-0">
                        <h1>Reports</h1>
                        <p className="subtitle">Generate and export reports</p>
                    </div>
                    <button className="btn-primary" onClick={exportCSV}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>

                {/* Summary Table */}
                <div className="table-container mb-6">
                    <div className="table-header">
                        <h2>Summary Report</h2>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Count</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className="font-medium">Total Complaints</td><td>{total}</td><td>100%</td></tr>
                            <tr><td className="font-medium">Resolved</td><td className="text-green-500 font-semibold">{resolved}</td><td>{total > 0 ? Math.round((resolved/total)*100) : 0}%</td></tr>
                            <tr><td className="font-medium">Pending</td><td className="text-orange-500 font-semibold">{pending}</td><td>{total > 0 ? Math.round((pending/total)*100) : 0}%</td></tr>
                            <tr><td className="font-medium">In Progress</td><td className="text-blue-500 font-semibold">{inProgress}</td><td>{total > 0 ? Math.round((inProgress/total)*100) : 0}%</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* By Category */}
                <div className="table-container">
                    <div className="table-header">
                        <h2>By Category</h2>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Total</th>
                                <th>Resolved</th>
                                <th>Pending</th>
                                <th>Resolution Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(categoryGroups).map(([cat, catIssues]) => {
                                const catResolved = catIssues.filter(i => i.status === 'resolved').length;
                                const catPending = catIssues.filter(i => i.status === 'pending').length;
                                const rate = catIssues.length > 0 ? Math.round((catResolved / catIssues.length) * 100) : 0;
                                return (
                                    <tr key={cat}>
                                        <td className="capitalize font-medium">{cat}</td>
                                        <td>{catIssues.length}</td>
                                        <td className="text-green-500 font-semibold">{catResolved}</td>
                                        <td className="text-orange-500 font-semibold">{catPending}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${rate}%` }} />
                                                </div>
                                                <span className="text-[0.8rem] font-semibold">{rate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
