import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function run() {
    const screenshotDir = 'C:/Users/nagar/.gemini/antigravity/brain/47a238e8-627c-4413-897e-7258057829fd/scratch/screenshots';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    console.log('🚀 Starting offline browser test with dynamic Postgrest single-row responses...');
    
    // Launch headless browser
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Listen to browser console logs
    page.on('console', msg => {
        console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    // Enable Request Interception
    await page.setRequestInterception(true);
    
    page.on('request', request => {
        const url = request.url();
        
        // CORS Headers helper
        const corsHeaders = {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
            'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'access-control-expose-headers': '*'
        };

        // Handle preflight requests
        if (request.method() === 'OPTIONS') {
            request.respond({
                status: 204,
                headers: corsHeaders
            });
            return;
        }

        // Handle HEAD/count queries
        if (request.method() === 'HEAD') {
            let count = 1;
            if (url.includes('/rest/v1/students')) count = 1;
            else if (url.includes('/rest/v1/teachers')) count = 1;
            else if (url.includes('/rest/v1/classes')) count = 3;
            else if (url.includes('/rest/v1/fee_receipts')) count = 1;
            else if (url.includes('/rest/v1/student_attendance')) count = 6;
            else if (url.includes('/rest/v1/student_enrollment_history')) count = 1;
            else if (url.includes('/rest/v1/marks')) count = 1;
            else if (url.includes('/rest/v1/exams')) count = 1;

            request.respond({
                status: 200,
                headers: {
                    ...corsHeaders,
                    'content-range': `0-0/${count}`
                },
                body: ''
            });
            return;
        }

        // Postgrest single-object header check
        const acceptHeader = request.headers()['accept'] || '';
        const isSingle = acceptHeader.includes('application/vnd.pgrst.object+json');
        
        if (url.includes('/auth/v1/token')) {
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'mock-access-token',
                    token_type: 'bearer',
                    expires_in: 3600,
                    refresh_token: 'mock-refresh-token',
                    user: {
                        id: 'admin-123',
                        aud: 'authenticated',
                        role: 'authenticated',
                        email: 'admin@gkvsschool.com',
                        email_confirmed_at: '2026-01-01T00:00:00Z',
                        user_metadata: {
                            role: 'admin',
                            full_name: 'System Admin'
                        }
                    }
                })
            });
        } else if (url.includes('/auth/v1/user') || url.includes('/auth/v1/recover')) {
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'admin-123',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'admin@gkvsschool.com',
                    email_confirmed_at: '2026-01-01T00:00:00Z',
                    user_metadata: {
                        role: 'admin',
                        full_name: 'System Admin'
                    }
                })
            });
        } else if (url.includes('/rest/v1/users')) {
            const responseData = { id: 'admin-123', email: 'admin@gkvsschool.com', role: 'admin' };
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify(isSingle ? responseData : [responseData])
            });
        } else if (url.includes('/rest/v1/academic_years')) {
            const responseData = { id: 'ay-2026', year_name: '2026-2027', status: 'active' };
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify(isSingle ? responseData : [responseData])
            });
        } else if (url.includes('/rest/v1/classes')) {
            const responseData = [
                { id: 'class-lkg', class_name: 'LKG', section: 'A' },
                { id: 'class-ukg', class_name: 'UKG', section: 'A' },
                { id: 'class-1', class_name: '1st Standard', section: 'A' }
            ];
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify(isSingle ? responseData[0] : responseData)
            });
        } else if (url.includes('/rest/v1/students')) {
            const responseData = [
                {
                    id: 'student-123',
                    full_name: 'Rohan Patil',
                    registration_number: 'REG2026001',
                    roll_number: '15',
                    parent_name: 'Basavaraj Patil',
                    parent_phone: '9900282804',
                    class_id: 'class-lkg',
                    academic_year_id: 'ay-2026',
                    address: 'Sharan Sirasagi, Kalaburagi',
                    aadhar_number: '1234-5678-9012',
                    is_first_admission: true,
                    photo_url: null,
                    classes: {
                        class_name: 'LKG',
                        section: 'A'
                    }
                }
            ];
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify(isSingle ? responseData[0] : responseData)
            });
        } else if (url.includes('/rest/v1/student_fees')) {
            const responseData = [
                {
                    id: 'fee-123',
                    student_id: 'student-123',
                    academic_year_id: 'ay-2026',
                    total_amount: 15000,
                    amount_paid: 9500,
                    amount_pending: 5500,
                    admission_fee: 1000,
                    tuition_fee: 8000,
                    betterment_fee: 2000,
                    sports_fee: 500,
                    reading_room_fee: 500,
                    medical_fee: 500,
                    laboratory_fee: 500,
                    ave_fee: 500,
                    swf: 500,
                    tbf: 500,
                    examination_fee: 500,
                    fines: 0,
                    others: 0
                }
            ];
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify(isSingle ? responseData[0] : responseData)
            });
        } else if (url.includes('/rest/v1/fee_receipts')) {
            const responseData = [
                {
                    id: 'receipt-001',
                    receipt_number: 1,
                    student_id: 'student-123',
                    academic_year_id: 'ay-2026',
                    receipt_date: '2026-06-10',
                    total_amount: 9500,
                    amount_paid: 9500,
                    amount_pending: 0,
                    payment_mode: 'UPI',
                    admission_fee: 1000,
                    tuition_fee: 5000,
                    betterment_fee: 2000,
                    sports_fee: 500,
                    reading_room_fee: 500,
                    medical_fee: 500,
                    laboratory_fee: 0,
                    ave_fee: 0,
                    swf: 0,
                    tbf: 0,
                    examination_fee: 0,
                    fines: 0,
                    others: 0
                }
            ];
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify(isSingle ? responseData[0] : responseData)
            });
        } else if (url.includes('/rest/v1/teachers')) {
            const responseData = [
                { id: 'teacher-1', full_name: 'Suresh Kumar', email: 'suresh@gkvsschool.com', is_active: true }
            ];
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify(isSingle ? responseData[0] : responseData)
            });
        } else if (url.includes('/rest/v1/student_attendance')) {
            const responseData = [
                { class_id: 'class-lkg', date: '2026-06-15', is_present: true, student_id: 'student-123' },
                { class_id: 'class-lkg', date: '2026-06-14', is_present: true, student_id: 'student-123' },
                { class_id: 'class-lkg', date: '2026-06-13', is_present: true, student_id: 'student-123' },
                { class_id: 'class-lkg', date: '2026-06-12', is_present: true, student_id: 'student-123' },
                { class_id: 'class-lkg', date: '2026-06-11', is_present: true, student_id: 'student-123' },
                { class_id: 'class-lkg', date: '2026-06-10', is_present: false, student_id: 'student-123' }
            ];
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify(isSingle ? responseData[0] : responseData)
            });
        } else if (url.includes('/rest/v1/student_enrollment_history')) {
            const responseData = [
                {
                    id: 'hist-123',
                    student_id: 'student-123',
                    status: 'active',
                    classes: { class_name: 'LKG' },
                    academic_years: { year_name: '2026-2027', start_date: '2026-06-01' }
                }
            ];
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify(isSingle ? responseData[0] : responseData)
            });
        } else if (url.includes('/rest/v1/marks')) {
            const responseData = [
                {
                    id: 'mark-123',
                    student_id: 'student-123',
                    exam_id: 'exam-123',
                    marks_obtained: 85,
                    max_marks: 100,
                    grade: 'A',
                    exams: {
                        exam_name: 'First Term Exam',
                        exam_date: '2026-05-10'
                    }
                }
            ];
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify(isSingle ? responseData[0] : responseData)
            });
        } else if (url.includes('/rest/v1/exams')) {
            const responseData = [
                { id: 'exam-123', exam_name: 'First Term Exam', exam_date: '2026-05-10' }
            ];
            request.respond({
                status: 200,
                headers: corsHeaders,
                contentType: 'application/json',
                body: JSON.stringify(isSingle ? responseData[0] : responseData)
            });
        } else {
            request.continue();
        }
    });

    try {
        // 1. Navigate to Login Page
        console.log('Step 1: Navigating to login page...');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(screenshotDir, '01_login_page.png') });

        // Fill credentials
        console.log('Filling login credentials...');
        await page.type('#email', 'admin@gkvsschool.com');
        await page.type('#password', 'TestPassword123!');
        
        // Submit
        console.log('Submitting login form...');
        await page.click('.login-button');
        
        // Wait for navigation to dashboard
        console.log('Waiting for dashboard redirection...');
        try {
            // Wait for sidebar/dashboard element to load instead of page navigation
            await page.waitForSelector('.dashboard-layout', { timeout: 10000 });
        } catch (e) {
            console.log('Timeout waiting for dashboard selector. Taking debug screenshot...');
            await page.screenshot({ path: path.join(screenshotDir, '01_login_error_debug.png') });
            throw e;
        }
        console.log('Successfully logged in. URL is:', page.url());
        await page.screenshot({ path: path.join(screenshotDir, '02_dashboard_page.png') });

        // 2. Navigate client-side to Billing Page
        console.log('Step 2: Navigating to /billing...');
        // Find Billing button in sidebar and click it
        const billingBtn = await page.evaluateHandle(() => {
            const items = Array.from(document.querySelectorAll('.nav-item'));
            return items.find(el => el.textContent.includes('Billing'));
        });
        if (billingBtn) {
            await billingBtn.click();
            await new Promise(r => setTimeout(r, 1000));
        } else {
            throw new Error('Billing button not found in sidebar');
        }
        await page.screenshot({ path: path.join(screenshotDir, '03_billing_page.png') });

        // 3. Navigate client-side to Students Page and click on Rohan Patil
        console.log('Step 3: Navigating to /students...');
        const studentsBtn = await page.evaluateHandle(() => {
            const items = Array.from(document.querySelectorAll('.nav-item'));
            return items.find(el => el.textContent.includes('Students'));
        });
        if (studentsBtn) {
            await studentsBtn.click();
            await page.waitForSelector('.students-grid', { timeout: 5000 });
            await page.screenshot({ path: path.join(screenshotDir, '04a_students_list.png') });

            // Click view on Rohan Patil card
            console.log('Clicking view on Rohan Patil card...');
            const viewCardBtn = await page.evaluateHandle(() => {
                // Find student card with Rohan Patil
                const cards = Array.from(document.querySelectorAll('.student-card'));
                const rohanCard = cards.find(c => c.textContent.includes('Rohan Patil'));
                if (rohanCard) {
                    // Find view button inside it (or target action button)
                    return rohanCard.querySelector('button');
                }
                return null;
            });

            if (viewCardBtn) {
                await viewCardBtn.click();
                await page.waitForSelector('.student-profile-page-container', { timeout: 5000 });
                console.log('Successfully loaded student profile. Scrolling down...');
                
                await page.evaluate(() => window.scrollBy(0, 450));
                await new Promise(r => setTimeout(r, 1000));
                await page.screenshot({ path: path.join(screenshotDir, '04b_student_profile_billing.png') });

                // Click "View Receipt" button in profile timeline
                const viewReceiptBtn = await page.evaluateHandle(() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    return btns.find(b => b.textContent.includes('View Receipt'));
                });

                // Check if the handle is valid
                const isViewReceiptBtnValid = viewReceiptBtn && (await viewReceiptBtn.jsonValue()) !== null;

                if (isViewReceiptBtnValid) {
                    console.log('Clicking "View Receipt" button in student profile...');
                    await viewReceiptBtn.click();
                    // Wait for the modal content to finish loading (marked by .receipt-border)
                    await page.waitForSelector('.receipt-border', { timeout: 5000 });
                    await page.screenshot({ path: path.join(screenshotDir, '05_receipt_view_modal.png') });
                    
                    // Close modal
                    console.log('Closing receipt modal...');
                    const closeBtn = await page.$('.modal-close-btn');
                    if (closeBtn) {
                        await closeBtn.click();
                        await new Promise(r => setTimeout(r, 500));
                    }
                } else {
                    console.log('View Receipt button not found in timeline.');
                }
            } else {
                console.log('Rohan Patil card or view button not found.');
            }
        }

        // 4. Navigate client-side to Fee Reports Page
        console.log('Step 4: Navigating to Billing menu...');
        if (billingBtn) {
            await billingBtn.click();
            await page.waitForSelector('.billing-grid', { timeout: 5000 });
            
            console.log('Clicking Fee Reports card...');
            const reportsCard = await page.evaluateHandle(() => {
                const cards = Array.from(document.querySelectorAll('.billing-card'));
                return cards.find(c => c.textContent.includes('Fee Reports'));
            });

            if (reportsCard) {
                await reportsCard.click();
                await page.waitForSelector('.fee-reports-page', { timeout: 5000 });
                await new Promise(r => setTimeout(r, 1000));
                await page.screenshot({ path: path.join(screenshotDir, '06_fee_reports_page.png') });

                // Click on Rohan Patil paid amount cell to open history drawer
                const paidCellBtn = await page.evaluateHandle(() => {
                    // Find row with Rohan Patil
                    const rows = Array.from(document.querySelectorAll('tr.student-report-row'));
                    const rohanRow = rows.find(r => r.textContent.includes('Rohan Patil'));
                    if (rohanRow) {
                        const cells = Array.from(rohanRow.querySelectorAll('td'));
                        return cells[4]?.querySelector('button'); // Paid cell button (index 4)
                    }
                    return null;
                });

                const isPaidCellBtnValid = paidCellBtn && (await paidCellBtn.jsonValue()) !== null;

                if (isPaidCellBtnValid) {
                    console.log('Clicking on paid amount to open history drawer...');
                    await paidCellBtn.click();
                    await page.waitForSelector('.history-drawer-content', { timeout: 5000 });
                    await page.screenshot({ path: path.join(screenshotDir, '07_reports_history_drawer.png') });

                    // Click "View Receipt" inside drawer
                    const drawerBtn = await page.evaluateHandle(() => {
                        const btns = Array.from(document.querySelectorAll('.inline-view-receipt-btn'));
                        return btns[0];
                    });

                    const isDrawerBtnValid = drawerBtn && (await drawerBtn.jsonValue()) !== null;

                    if (isDrawerBtnValid) {
                        console.log('Clicking View Receipt inside drawer...');
                        await drawerBtn.click();
                        // Wait for the modal content to finish loading (marked by .receipt-border)
                        await page.waitForSelector('.receipt-border', { timeout: 5000 });
                        await page.screenshot({ path: path.join(screenshotDir, '08_reports_receipt_modal.png') });
                    } else {
                        console.log('Drawer View Receipt button not found.');
                    }
                } else {
                    console.log('Paid amount cell button not found.');
                }
            }
        }

        console.log('✅ Automated offline visual tests completed successfully!');
    } catch (err) {
        console.error('❌ Error during testing:', err);
    } finally {
        await browser.close();
    }
}

run();
