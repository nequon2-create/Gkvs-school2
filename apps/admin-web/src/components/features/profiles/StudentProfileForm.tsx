import { useState } from 'react';
import { PhotoUpload } from '../../common/PhotoUpload';
import type { StudentFormData, Gender } from '../../../types/profile.types';
import type { AcademicYear } from '../../../types/academic-years.types';
import {
    validateRequired,
    validateEmail,
    validatePhone,
    validateAge,
    validateUrl
} from '../../../utils/validation';
import './StudentProfileForm.css';
import './submit-button.css';

interface Class {
    id: string;
    class_name: string;
    academic_year_id: string;
    section?: string | null;
}

export interface StudentProfileFormProps {
    onSubmit: (data: StudentFormData) => Promise<void>;
    academicYears: AcademicYear[];
    classes: Class[];
    loading?: boolean;
    loadingYears?: boolean;
    loadingClasses?: boolean;
    initialData?: Partial<StudentFormData>;
    isEditing?: boolean;
}

export function StudentProfileForm({
    onSubmit,
    academicYears,
    classes,
    loading = false,
    loadingYears = false,
    loadingClasses = false,
    initialData,
    isEditing = false,
}: StudentProfileFormProps) {
    const [formData, setFormData] = useState<StudentFormData>({
        full_name: initialData?.full_name || '',
        gender: initialData?.gender || 'male',
        date_of_birth: initialData?.date_of_birth || '',
        parent_name: initialData?.parent_name || '',
        parent_phone: initialData?.parent_phone || '',
        parent_email: initialData?.parent_email || '',
        academic_year_id: initialData?.academic_year_id || '',
        class_id: initialData?.class_id || '',
        photo_url: initialData?.photo_url || '',
        address: initialData?.address || '',
        login_id: initialData?.login_id || '',
        password: '', // Password not pre-filled for security
        aadhar_number: initialData?.aadhar_number || '',
        is_first_admission: initialData?.is_first_admission ?? false,
        past_school_name: initialData?.past_school_name || '',
        past_class: initialData?.past_class || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // We no longer filter classes by academic year, as requested by the user.
    // All classes should be available regardless of the selected academic year.
    const filteredClasses = classes;

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        const nameError = validateRequired(formData.full_name, 'Full name');
        if (nameError) newErrors.full_name = nameError;

        const ageError = validateAge(formData.date_of_birth, 3, 25);
        if (ageError) newErrors.date_of_birth = ageError;

        const parentNameError = validateRequired(formData.parent_name, 'Parent name');
        if (parentNameError) newErrors.parent_name = parentNameError;

        if (!validatePhone(formData.parent_phone)) {
            newErrors.parent_phone = 'Please enter a valid 10-digit phone number';
        }

        if (formData.parent_email && !validateEmail(formData.parent_email)) {
            newErrors.parent_email = 'Please enter a valid email address';
        }

        const yearError = validateRequired(formData.academic_year_id, 'Academic year');
        if (yearError) newErrors.academic_year_id = yearError;

        const classError = validateRequired(formData.class_id, 'Class');
        if (classError) newErrors.class_id = classError;

        if (formData.photo_url && !validateUrl(formData.photo_url)) {
            newErrors.photo_url = 'Please enter a valid URL';
        }

        const loginIdError = validateRequired(formData.login_id, 'Login ID');
        if (loginIdError) newErrors.login_id = loginIdError;

        const aadharError = validateRequired(formData.aadhar_number, 'Aadhar Number');
        if (aadharError) newErrors.aadhar_number = aadharError;

        // Conditional validation for Past School Info
        if (!formData.is_first_admission) {
            const pastSchoolError = validateRequired(formData.past_school_name || '', 'Past School Name');
            if (pastSchoolError) newErrors.past_school_name = pastSchoolError;

            const pastClassError = validateRequired(formData.past_class || '', 'Past Class');
            if (pastClassError) newErrors.past_class = pastClassError;
        }

        if (!isEditing) {
            const passwordError = validateRequired(formData.password, 'Password');
            if (passwordError) newErrors.password = passwordError;
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

        await onSubmit(formData);
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        validate();
    };

    const handleChange = (field: keyof StudentFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (touched[field]) {
            validate();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="student-profile-form">
            {/* Personal Information */}
            <section className="form-section">
                <h3 className="section-title">Personal Information</h3>

                <PhotoUpload
                    currentPhoto={formData.photo_url}
                    onPhotoChange={(url) => handleChange('photo_url', url)}
                    bucketName="student-photos"
                    label="Student Photo"
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
                        placeholder="Enter student's full name"
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
                        <label htmlFor="date_of_birth" className="form-label">
                            Date of Birth <span className="required">*</span>
                        </label>
                        <input
                            id="date_of_birth"
                            type="date"
                            className={`form-input ${touched.date_of_birth && errors.date_of_birth ? 'error' : ''}`}
                            value={formData.date_of_birth}
                            onChange={(e) => handleChange('date_of_birth', e.target.value)}
                            onBlur={() => handleBlur('date_of_birth')}
                            disabled={loading}
                        />
                        {touched.date_of_birth && errors.date_of_birth && (
                            <span className="error-message">{errors.date_of_birth}</span>
                        )}
                    </div>
                </div>
            </section>

            {/* Parent/Guardian Information */}
            <section className="form-section">
                <h3 className="section-title">Parent/Guardian Information</h3>

                <div className="form-group">
                    <label htmlFor="parent_name" className="form-label">
                        Parent Name <span className="required">*</span>
                    </label>
                    <input
                        id="parent_name"
                        type="text"
                        className={`form-input ${touched.parent_name && errors.parent_name ? 'error' : ''}`}
                        value={formData.parent_name}
                        onChange={(e) => handleChange('parent_name', e.target.value)}
                        onBlur={() => handleBlur('parent_name')}
                        disabled={loading}
                        placeholder="Enter parent's full name"
                    />
                    {touched.parent_name && errors.parent_name && (
                        <span className="error-message">{errors.parent_name}</span>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="parent_phone" className="form-label">
                            Parent Phone <span className="required">*</span>
                        </label>
                        <input
                            id="parent_phone"
                            type="tel"
                            className={`form-input ${touched.parent_phone && errors.parent_phone ? 'error' : ''}`}
                            value={formData.parent_phone}
                            onChange={(e) => handleChange('parent_phone', e.target.value)}
                            onBlur={() => handleBlur('parent_phone')}
                            disabled={loading}
                            placeholder="10-digit mobile number"
                        />
                        {touched.parent_phone && errors.parent_phone && (
                            <span className="error-message">{errors.parent_phone}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="parent_email" className="form-label">
                            Parent Email
                        </label>
                        <input
                            id="parent_email"
                            type="email"
                            className={`form-input ${touched.parent_email && errors.parent_email ? 'error' : ''}`}
                            value={formData.parent_email}
                            onChange={(e) => handleChange('parent_email', e.target.value)}
                            onBlur={() => handleBlur('parent_email')}
                            disabled={loading}
                            placeholder="parent@example.com"
                        />
                        {touched.parent_email && errors.parent_email && (
                            <span className="error-message">{errors.parent_email}</span>
                        )}
                    </div>
                </div>
            </section>

            {/* Additional Information (Aadhar & Past School) */}
            <section className="form-section">
                <h3 className="section-title">Additional Information</h3>

                <div className="form-group">
                    <label htmlFor="aadhar_number" className="form-label">
                        Aadhar Number <span className="required">*</span>
                    </label>
                    <input
                        id="aadhar_number"
                        type="text"
                        className={`form-input ${touched.aadhar_number && errors.aadhar_number ? 'error' : ''}`}
                        value={formData.aadhar_number}
                        onChange={(e) => handleChange('aadhar_number', e.target.value)}
                        onBlur={() => handleBlur('aadhar_number')}
                        disabled={loading}
                        placeholder="Enter 12-digit Aadhar Number"
                    />
                    {touched.aadhar_number && errors.aadhar_number && (
                        <span className="error-message">{errors.aadhar_number}</span>
                    )}
                </div>

                <div className="form-group checkbox-group" style={{ marginTop: '16px', marginBottom: '24px' }}>
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.is_first_admission}
                            onChange={(e) => {
                                const isFirst = e.target.checked;
                                setFormData((prev) => ({
                                    ...prev,
                                    is_first_admission: isFirst,
                                    // Clear past fields when checked
                                    past_school_name: isFirst ? '' : prev.past_school_name,
                                    past_class: isFirst ? '' : prev.past_class,
                                }));
                                // Reset errors for past fields if it's first admission
                                if (isFirst) {
                                    setErrors((prev) => {
                                        const newErrors = { ...prev };
                                        delete newErrors.past_school_name;
                                        delete newErrors.past_class;
                                        return newErrors;
                                    });
                                }
                            }}
                            disabled={loading}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '15px', color: '#1D1D1F', fontWeight: '500' }}>This is the student's first school admission</span>
                    </label>
                </div>

                {!formData.is_first_admission && (
                    <div className="form-row animate-slide-in">
                        <div className="form-group">
                            <label htmlFor="past_school_name" className="form-label">
                                Past School Name <span className="required">*</span>
                            </label>
                            <input
                                id="past_school_name"
                                type="text"
                                className={`form-input ${touched.past_school_name && errors.past_school_name ? 'error' : ''}`}
                                value={formData.past_school_name || ''}
                                onChange={(e) => handleChange('past_school_name', e.target.value)}
                                onBlur={() => handleBlur('past_school_name')}
                                disabled={loading}
                                placeholder="Name of previous school"
                            />
                            {touched.past_school_name && errors.past_school_name && (
                                <span className="error-message">{errors.past_school_name}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="past_class" className="form-label">
                                Past Class <span className="required">*</span>
                            </label>
                            <select
                                id="past_class"
                                className={`form-input ${touched.past_class && errors.past_class ? 'error' : ''}`}
                                value={formData.past_class || ''}
                                onChange={(e) => handleChange('past_class', e.target.value)}
                                onBlur={() => handleBlur('past_class')}
                                disabled={loading}
                            >
                                <option value="">Select past class</option>
                                {[...Array(10)].map((_, i) => (
                                    <option key={i + 1} value={`Class ${i + 1}`}>
                                        Class {i + 1}
                                    </option>
                                ))}
                            </select>
                            {touched.past_class && errors.past_class && (
                                <span className="error-message">{errors.past_class}</span>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* Academic Information */}
            <section className="form-section">
                <h3 className="section-title">Academic Information</h3>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="academic_year_id" className="form-label">
                            Academic Year <span className="required">*</span>
                        </label>
                        <select
                            id="academic_year_id"
                            className={`form-input ${touched.academic_year_id && errors.academic_year_id ? 'error' : ''}`}
                            value={formData.academic_year_id}
                            onChange={(e) => handleChange('academic_year_id', e.target.value)}
                            onBlur={() => handleBlur('academic_year_id')}
                            disabled={loading || loadingYears}
                        >
                            <option value="">Select academic year</option>
                            {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.year_name} {year.is_current ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                        {touched.academic_year_id && errors.academic_year_id && (
                            <span className="error-message">{errors.academic_year_id}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="class_id" className="form-label">
                            Class <span className="required">*</span>
                        </label>
                        <select
                            id="class_id"
                            className={`form-input ${touched.class_id && errors.class_id ? 'error' : ''}`}
                            value={formData.class_id}
                            onChange={(e) => handleChange('class_id', e.target.value)}
                            onBlur={() => handleBlur('class_id')}
                            disabled={loading || loadingClasses || !formData.academic_year_id}
                        >
                            <option value="">Select class</option>
                            {filteredClasses.map((classItem) => (
                                <option key={classItem.id} value={classItem.id}>
                                    {classItem.class_name}{classItem.section ? ` - Section ${classItem.section}` : ''}
                                </option>
                            ))}
                        </select>
                        {touched.class_id && errors.class_id && (
                            <span className="error-message">{errors.class_id}</span>
                        )}
                        {!formData.academic_year_id && (
                            <span className="form-hint">Select academic year first</span>
                        )}
                    </div>
                </div>
            </section>

            {/* Account Credentials */}
            <section className="form-section">
                <h3 className="section-title">Account Credentials</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="login_id" className="form-label">
                            Login ID <span className="required">*</span>
                        </label>
                        <input
                            id="login_id"
                            type="text"
                            className={`form-input ${touched.login_id && errors.login_id ? 'error' : ''}`}
                            value={formData.login_id}
                            onChange={(e) => handleChange('login_id', e.target.value)}
                            onBlur={() => handleBlur('login_id')}
                            disabled={loading}
                            placeholder="Create a unique login ID"
                            autoComplete="new-username"
                        />
                        {touched.login_id && errors.login_id && (
                            <span className="error-message">{errors.login_id}</span>
                        )}
                        <span className="form-hint">This ID will be used for logging in</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Password {isEditing ? <span className="optional">(Leave blank to keep current)</span> : <span className="required">*</span>}
                        </label>
                        <input
                            id="password"
                            type="password"
                            className={`form-input ${touched.password && errors.password ? 'error' : ''}`}
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            onBlur={() => handleBlur('password')}
                            disabled={loading}
                            placeholder="Create a strong password"
                            autoComplete="new-password"
                        />
                        {touched.password && errors.password && (
                            <span className="error-message">{errors.password}</span>
                        )}
                    </div>
                </div>
            </section>

            {/* Additional Information */}
            <section className="form-section">
                <h3 className="section-title">Additional Information</h3>

                <div className="form-group">
                    <PhotoUpload
                        currentPhoto={formData.photo_url}
                        onPhotoChange={(url) => {
                            setFormData(prev => ({ ...prev, photo_url: url }));
                            // Clear validation error if any
                            if (errors.photo_url) {
                                setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.photo_url;
                                    return newErrors;
                                });
                            }
                        }}
                        bucketName="profiles"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="address" className="form-label">
                        Address
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
                        parent_name: '',
                        parent_phone: '',
                        parent_email: '',
                        academic_year_id: '',
                        class_id: '',
                        photo_url: '',
                        address: '',
                        login_id: '',
                        password: '',
                        aadhar_number: '',
                        is_first_admission: false,
                        past_school_name: '',
                        past_class: '',
                    })}
                    disabled={loading}
                >
                    Reset
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Student')}
                </button>
            </div>
        </form>
    );
}
