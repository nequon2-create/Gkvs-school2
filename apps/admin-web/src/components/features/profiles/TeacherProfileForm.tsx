import { useState } from 'react';
import { PhotoUpload } from '../../common/PhotoUpload';
import { AppleDatePicker } from '../../common/AppleDatePicker';
import { Eye, EyeOff } from 'lucide-react';
import type { TeacherFormData, Gender } from '../../../types/profile.types';
import {
    validateRequired,
    validateEmail,
    validatePhone,
    validateAge,
    validateUrl
} from '../../../utils/validation';
import './TeacherProfileForm.css';
import './submit-button.css';

export interface TeacherProfileFormProps {
    onSubmit: (data: TeacherFormData) => Promise<void>;
    loading?: boolean;
    initialData?: Partial<TeacherFormData>;
    isEditing?: boolean;
}

export function TeacherProfileForm({
    onSubmit,
    loading = false,
    initialData,
    isEditing = false,
}: TeacherProfileFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState<TeacherFormData>({
        full_name: initialData?.full_name || '',
        gender: initialData?.gender || 'male',
        date_of_birth: initialData?.date_of_birth || '',
        subject: initialData?.subject || '',
        qualification: initialData?.qualification || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        photo_url: initialData?.photo_url || '',
        address: initialData?.address || '',
        login_id: initialData?.login_id || '',
        password: '', // Password not pre-filled
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const generateRandomLoginId = () => {
        const randomNum = Math.floor(100 + Math.random() * 900);
        const namePart = formData.full_name
            ? formData.full_name.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
            : 'tch';
        const generated = `${namePart}${randomNum}`;
        setFormData((prev) => ({ ...prev, login_id: generated }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        const nameError = validateRequired(formData.full_name, 'Full name');
        if (nameError) newErrors.full_name = nameError;

        const ageError = validateAge(formData.date_of_birth, 21, 70);
        if (ageError) newErrors.date_of_birth = ageError;

        const subjectError = validateRequired(formData.subject, 'Subject');
        if (subjectError) newErrors.subject = subjectError;

        const qualificationError = validateRequired(formData.qualification, 'Qualification');
        if (qualificationError) newErrors.qualification = qualificationError;

        // Phone is optional: validate only if entered
        if (formData.phone && !validatePhone(formData.phone)) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }

        // Email is optional: validate only if entered
        if (formData.email && !validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.photo_url && !validateUrl(formData.photo_url)) {
            newErrors.photo_url = 'Please enter a valid URL';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched
        const allFields = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
        setTouched(allFields);

        if (!validate()) return;

        // Auto-generate login_id if left empty
        let finalLoginId = formData.login_id.trim();
        if (!finalLoginId) {
            const randomNum = Math.floor(100 + Math.random() * 900);
            const namePart = formData.full_name
                ? formData.full_name.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
                : 'tch';
            finalLoginId = `${namePart}${randomNum}`;
        }

        // Default password to 123456 if left empty (for new profiles)
        let finalPassword = formData.password.trim();
        if (!isEditing && !finalPassword) {
            finalPassword = '123456';
        }

        await onSubmit({
            ...formData,
            login_id: finalLoginId,
            password: finalPassword,
        });
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        validate();
    };

    const handleChange = (field: keyof TeacherFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (touched[field]) {
            validate();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="teacher-profile-form">
            {/* Personal Information */}
            <section className="form-section">
                <h3 className="section-title">Personal Information</h3>

                {/* Single Polished Photo Upload */}
                <PhotoUpload
                    currentPhoto={formData.photo_url}
                    onPhotoChange={(url) => {
                        setFormData((prev) => ({ ...prev, photo_url: url }));
                        if (errors.photo_url) {
                            setErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.photo_url;
                                return newErrors;
                            });
                        }
                    }}
                    bucketName="teacher-photos"
                    label="Teacher Profile Photo"
                />

                <div className="form-group">
                    <label htmlFor="full_name" className="form-label">
                        Full Name <span className="required">*</span>
                    </label>
                    <input
                        id="full_name"
                        type="text"
                        className={`form-input ${touched.full_name && errors.full_name ? 'error' : ''}`}
                        value={formData.full_name}
                        onChange={(e) => handleChange('full_name', e.target.value)}
                        onBlur={() => handleBlur('full_name')}
                        disabled={loading}
                        placeholder="Enter teacher's full name"
                    />
                    {touched.full_name && errors.full_name && (
                        <span className="error-message">{errors.full_name}</span>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">
                            Gender <span className="required">*</span>
                        </label>
                        <div className="radio-group">
                            {(['male', 'female', 'other'] as Gender[]).map((gender) => (
                                <label key={gender} className="radio-label">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value={gender}
                                        checked={formData.gender === gender}
                                        onChange={(e) => handleChange('gender', e.target.value)}
                                        disabled={loading}
                                    />
                                    <span>{gender.charAt(0).toUpperCase() + gender.slice(1)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <AppleDatePicker
                            label="Date of Birth"
                            required
                            value={formData.date_of_birth}
                            onChange={(dateStr) => handleChange('date_of_birth', dateStr)}
                            error={touched.date_of_birth ? errors.date_of_birth : undefined}
                            disabled={loading}
                            defaultYear={new Date().getFullYear() - 30}
                            minYear={new Date().getFullYear() - 70}
                            maxYear={new Date().getFullYear() - 20}
                        />
                    </div>
                </div>
            </section>

            {/* Professional Information */}
            <section className="form-section">
                <h3 className="section-title">Professional Information</h3>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="subject" className="form-label">
                            Subject/Department <span className="required">*</span>
                        </label>
                        <input
                            id="subject"
                            type="text"
                            className={`form-input ${touched.subject && errors.subject ? 'error' : ''}`}
                            value={formData.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            onBlur={() => handleBlur('subject')}
                            disabled={loading}
                            placeholder="e.g., Mathematics, Science, English"
                        />
                        {touched.subject && errors.subject && (
                            <span className="error-message">{errors.subject}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="qualification" className="form-label">
                            Qualification <span className="required">*</span>
                        </label>
                        <input
                            id="qualification"
                            type="text"
                            className={`form-input ${touched.qualification && errors.qualification ? 'error' : ''}`}
                            value={formData.qualification}
                            onChange={(e) => handleChange('qualification', e.target.value)}
                            onBlur={() => handleBlur('qualification')}
                            disabled={loading}
                            placeholder="e.g., B.Ed, M.Sc, M.A."
                        />
                        {touched.qualification && errors.qualification && (
                            <span className="error-message">{errors.qualification}</span>
                        )}
                    </div>
                </div>
            </section>

            {/* Contact Information (Optional) */}
            <section className="form-section">
                <h3 className="section-title">Contact Information</h3>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="phone" className="form-label">
                            Phone <span className="optional">(Optional)</span>
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            className={`form-input ${touched.phone && errors.phone ? 'error' : ''}`}
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            onBlur={() => handleBlur('phone')}
                            disabled={loading}
                            placeholder="10-digit mobile number"
                        />
                        {touched.phone && errors.phone && (
                            <span className="error-message">{errors.phone}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email <span className="optional">(Optional)</span>
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={`form-input ${touched.email && errors.email ? 'error' : ''}`}
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            onBlur={() => handleBlur('email')}
                            disabled={loading}
                            placeholder="teacher@example.com"
                        />
                        {touched.email && errors.email && (
                            <span className="error-message">{errors.email}</span>
                        )}
                    </div>
                </div>
            </section>

            {/* Account Credentials */}
            <section className="form-section">
                <h3 className="section-title">Account Credentials</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="login_id" className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Login ID <span className="optional">(Auto-generated if empty)</span></span>
                            <button
                                type="button"
                                onClick={generateRandomLoginId}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0071E3',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                ⚡ Generate ID
                            </button>
                        </label>
                        <input
                            id="login_id"
                            type="text"
                            className={`form-input ${touched.login_id && errors.login_id ? 'error' : ''}`}
                            value={formData.login_id}
                            onChange={(e) => handleChange('login_id', e.target.value)}
                            onBlur={() => handleBlur('login_id')}
                            disabled={loading}
                            placeholder="Auto-generated e.g. anita402"
                            autoComplete="new-username"
                        />
                        {touched.login_id && errors.login_id && (
                            <span className="error-message">{errors.login_id}</span>
                        )}
                        <span className="form-hint">This ID will be used for logging into Teacher portal</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Password {!isEditing && <span className="optional">(Default: 123456)</span>}
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className={`form-input ${touched.password && errors.password ? 'error' : ''}`}
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                onBlur={() => handleBlur('password')}
                                disabled={loading}
                                placeholder={isEditing ? 'Leave blank to keep current' : 'Default: 123456'}
                                autoComplete="new-password"
                                style={{ paddingRight: '44px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#64748B',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    transition: 'color 150ms ease',
                                }}
                                title={showPassword ? 'Hide Password' : 'Show Password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {touched.password && errors.password && (
                            <span className="error-message">{errors.password}</span>
                        )}
                    </div>
                </div>
            </section>

            {/* Additional Information (Address) */}
            <section className="form-section">
                <h3 className="section-title">Additional Information</h3>

                <div className="form-group">
                    <label htmlFor="address" className="form-label">
                        Address <span className="optional">(Optional)</span>
                    </label>
                    <textarea
                        id="address"
                        className="form-input form-textarea"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        disabled={loading}
                        placeholder="Enter residential address"
                        rows={3}
                    />
                </div>
            </section>

            {/* Form Actions */}
            <div className="form-actions">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setFormData({
                        full_name: '',
                        gender: 'male',
                        date_of_birth: '',
                        subject: '',
                        qualification: '',
                        phone: '',
                        email: '',
                        photo_url: '',
                        address: '',
                        login_id: '',
                        password: '',
                    })}
                    disabled={loading}
                >
                    Reset Form
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Teacher')}
                </button>
            </div>
        </form>
    );
}
