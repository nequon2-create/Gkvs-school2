import { Award, Clock } from 'lucide-react';

export function CertificationPage() {
    return (
        <div className="flex-1 p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Certification</h1>
                    <p className="text-gray-600 mt-1">Manage student certificates and achievements</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 mt-8 flex flex-col items-center justify-center min-h-[500px] text-center">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <Award className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon!</h2>
                <p className="text-gray-500 max-w-md mx-auto text-lg mb-8 leading-relaxed">
                    We are currently building the Certification platform. Soon you'll be able to design, generate, and issue digital certificates to students directly from here.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 font-medium">
                    <Clock size={18} />
                    <span>Under Development</span>
                </div>
            </div>
        </div>
    );
}
