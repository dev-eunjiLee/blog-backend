import { ConsoleLogger, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CustomLogger extends ConsoleLogger {
  private readonly requestId: string;
  private email: string;
  private logList: Array<string> = [];

  /**
   * @description 로거 생성자 - 이벤트 패턴과 같이 새로운 logger를 생성이 필요하나 requestId가 연결되어야 할 경우 파라미터로 받음
   */
  constructor(requestId?: string) {
    super();
    this.requestId = requestId ?? uuidv4();
    this.customLog('initialize CustomLogger', {
      className: this.constructor.name,
      methodName: 'constructor',
    });
  }

  getRequestId() {
    return this.requestId;
  }

  setEmail(email: string) {
    this.email = email;
    this.customLog('set email', {
      className: this.constructor.name,
      methodName: this.setEmail.name,
    });
  }

  customLog(
    message: any,
    option?: { className?: string; methodName?: string },
  ) {
    // TODO 로그에 있는 ACCOUNT_ID 제거
    const prefix = this.getPrefix(option);
    const processedMessage = this.processMessage(message);
    this.logList.push(JSON.stringify({ prefix, processedMessage }));
    this.log(processedMessage, prefix);
  }

  customError(
    errors: any,
    option?: { className?: string; methodName?: string },
  ) {
    const prefix = this.getPrefix(option);
    const processedExtensions = this.processMessage(errors);
    this.logList.push(JSON.stringify({ prefix, processedExtensions }));
    this.error(processedExtensions, prefix);
  }

  // TODO  Warn 추가

  async destroy() {
    this.customLog('destroy logger', {
      className: this.constructor.name,
      methodName: 'destroy',
    });
    this.customLog(this.logList, {
      className: this.constructor.name,
      methodName: this.destroy.name,
    });
    this.logList = [];
  }

  /**
   * 로그를 구분할 수 있는 prefix를 생성 후 반환하는 함수
   * @param option (optional) 로그의 prefix를 위한 추가 정보
   * @returns 로그를 구분할 수 있는 prefix
   */
  private getPrefix(option?: { className?: string; methodName?: string }) {
    // constructor에서 생성된 requestId를 prefix의 가장 앞에 부여
    let prefix = this.requestId;

    // option이 존재할 경우 추가 정보를 prefix에 부여
    if (option) {
      if (option.className) {
        prefix = `${prefix} # ${option.className}`;
      }
      if (option.methodName) {
        prefix = `${prefix} # ${option.methodName}`;
      }
    }

    // 이메일이 존재할 경우 prefix에 부여
    if (this.email) prefix = `# ${this.email} # ${prefix} `;

    // prefix
    return `[${prefix}]`;
  }

  private processMessage(message: any): string {
    if (typeof message === 'object') {
      if (
        message.input &&
        Array.isArray(message.input) &&
        message.input[0] &&
        message.input[0].constructor.name === 'ExecutionContextHost' &&
        message.input[0].contextType === 'graphql'
      ) {
        // input이 실행 컨텍스트(ExecutionContext)인 경우, input과 custom header인 access_token 만 로그에 추가함
        return JSON.stringify([
          message.input[0].args[1],
          [{ access_token: message.input[0].args[2].access_token }],
        ]);
      } else if (
        message.input &&
        Array.isArray(message.input) &&
        message.input[0] &&
        message.input[0].constructor.name === 'ExecutionContextHost' &&
        message.input[0].contextType === 'http'
      ) {
        return JSON.stringify([
          message.input[0].switchToHttp().getRequest().body,
          [
            {
              access_token: message.input[0].switchToHttp().getRequest()
                .headers['access-token'],
            },
          ],
        ]);
      } else {
        return JSON.stringify(message);
      }
    }
    return message;
  }
}
