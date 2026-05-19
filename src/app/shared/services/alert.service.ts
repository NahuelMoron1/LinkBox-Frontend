import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  /**
   * Show success alert
   */
  success(title: string, message: string = ''): Promise<any> {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'OK',
    });
  }

  /**
   * Show error alert
   */
  error(title: string, message: string = ''): Promise<any> {
    return Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'OK',
    });
  }

  /**
   * Show warning alert
   */
  warning(title: string, message: string = ''): Promise<any> {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'OK',
    });
  }

  /**
   * Show info alert
   */
  info(title: string, message: string = ''): Promise<any> {
    return Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'OK',
    });
  }

  /**
   * Show confirmation dialog (returns true if confirmed, false if cancelled)
   */
  confirm(
    title: string,
    message: string = '',
    confirmText = 'Yes',
    cancelText = 'No',
  ): Promise<boolean> {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
    }).then((result) => result.isConfirmed);
  }

  /**
   * Show upgrade plan prompt (Pro/Ultimate)
   */
  upgradePrompt(
    currentPlan: string,
    nextPlan: string,
    price: number,
  ): Promise<any> {
    return Swal.fire({
      icon: 'info',
      title: `Upgrade to ${nextPlan} Plan?`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Current Plan:</strong> ${currentPlan}</p>
          <p><strong>Upgrade to:</strong> ${nextPlan}</p>
          <p><strong>Price:</strong> $${price}/month</p>
          <hr style="margin: 15px 0;" />
          <p>This feature is only available in the ${nextPlan} plan.</p>
          <p>Upgrade now to access unlimited telemetry recording and storage.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Upgrade Now',
      cancelButtonText: 'Cancel',
    }).then((result) => result.isConfirmed);
  }

  /**
   * Show subscription expired modal
   */
  subscriptionExpired(): Promise<any> {
    return Swal.fire({
      icon: 'error',
      title: 'Subscription Expired',
      text: 'Your subscription has expired. Please renew to continue using LinkBox.',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Renew Subscription',
    });
  }

  /**
   * Show session saved success
   */
  sessionSaved(sessionName: string, totalRecords: number): Promise<any> {
    return Swal.fire({
      icon: 'success',
      title: 'Session Saved',
      html: `
        <div style="text-align: left;">
          <p><strong>Session:</strong> ${sessionName}</p>
          <p><strong>Records:</strong> ${totalRecords}</p>
        </div>
      `,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'OK',
    });
  }

  /**
   * Show Pro plan limit reached
   */
  proLimitReached(
    current: number,
    limit: number,
    resetDate: Date,
  ): Promise<any> {
    return Swal.fire({
      icon: 'warning',
      title: 'Session Limit Reached',
      html: `
        <div style="text-align: left; margin: 15px 0;">
          <p>You have reached your monthly limit of saved sessions.</p>
          <p><strong>Sessions Saved:</strong> ${current}/${limit}</p>
          <p><strong>Resets:</strong> ${resetDate.toLocaleDateString()}</p>
          <hr style="margin: 15px 0;" />
          <p>Upgrade to <strong>Ultimate</strong> plan for unlimited sessions.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Upgrade Now',
      cancelButtonText: 'Cancel',
    }).then((result) => result.isConfirmed);
  }

  /**
   * Show loading toast
   */
  loading(message: string = 'Loading...'): void {
    Swal.fire({
      title: message,
      icon: 'info',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  /**
   * Close loading toast
   */
  closeLoading(): void {
    Swal.close();
  }

  /**
   * Show plan features comparison
   */
  planComparison(): Promise<any> {
    return Swal.fire({
      title: 'LinkBox Plans',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <div style="margin-bottom: 20px;">
            <h4 style="color: #3b82f6; margin-bottom: 10px;">Basic - Free</h4>
            <ul style="text-align: left; margin-left: 20px;">
              <li>Live telemetry streaming</li>
              <li>Real-time data display</li>
            </ul>
          </div>
          <div style="margin-bottom: 20px;">
            <h4 style="color: #10b981; margin-bottom: 10px;">Pro - $20/month</h4>
            <ul style="text-align: left; margin-left: 20px;">
              <li>All Basic features</li>
              <li>Save up to 2 sessions per month</li>
              <li>Access session history</li>
            </ul>
          </div>
          <div>
            <h4 style="color: #8b5cf6; margin-bottom: 10px;">Ultimate - $30/month</h4>
            <ul style="text-align: left; margin-left: 20px;">
              <li>All Pro features</li>
              <li>Unlimited session recording & storage</li>
              <li>Automatic data backup</li>
              <li>Advanced analytics</li>
            </ul>
          </div>
        </div>
      `,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Close',
    });
  }

  /**
   * Show loading spinner with message
   */
  loadingWithSpinner(message: string = 'Processing...'): void {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  /**
   * Close any open alert
   */
  close(): void {
    Swal.close();
  }
}
