// deno-lint-ignore-file no-case-declarations no-explicit-any
import { Stmt, Program, Expr, BinaryExpr, NumericLiteral, Identifier } from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";

export default class Parser {
    private tokens: Token[] = [];


    private not_eof (): boolean {
        return this.tokens[0].type != TokenType.EOF;
    }

    public produceAST (sourceCode: string): Program {
        
        this.tokens = tokenize(sourceCode);

        const program: Program = {
            kind: "Program",
            body: [],
        };

        while (this.not_eof()) {
            program.body.push(this.parse_stmt())
        }


        return program;
    }

    private at () {
        return this.tokens[0] as Token;
    }

    private advance () {
        const prev = this.tokens.shift() as Token;
        return prev;
    }

    private expect (type: TokenType, err: any) {
        const prev = this.tokens.shift() as Token;
        if (!prev || prev.type == type) {
            console.error("parser Error:\n", err, " Expecting: ", type);
            Deno.exit(1);
        }
        return prev
    }

    private parse_stmt (): Stmt {
        // skip to parse_expr
        return this.parse_expr();
    }

    private parse_expr (): Expr {
       return this.parse_additive_expr(); 
    }

    private parse_additive_expr(): Expr {
       // left hand precidence
       let left = this.parse_multiplicitive_expr();
       
       while (this.at().value == "+" || this.at().value == "-") {
            const operator = this.advance().value;
            const right = this.parse_multiplicitive_expr();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            } as BinaryExpr;
       }

       return left;
    }

    private parse_multiplicitive_expr(): Expr {
        // left hand precidence
        let left = this.parse_primary_expr();
        
        while (this.at().value == "/" || this.at().value == "*" || this.at().value == "%"
        ) {
             const operator = this.advance().value;
             const right = this.parse_primary_expr();
             left = {
                 kind: "BinaryExpr",
                 left,
                 right,
                 operator,
             } as BinaryExpr;
        }
 
        return left;
     }
    // Orders of Prescidence
    // 9 AssigmentExpr
    // 8 MemberExpr
    // 7 FunctionCall
    // 6 LogicalExpr
    // 5 ComparisonExpr
    // 4 AdditiveExpr
    // 3 MultiplicitaveExpr
    // 2 UnaryExpr
    // 1 PrimaryExpr

    private parse_primary_expr (): Expr {
        const tk = this.at().type;

        switch (tk) {
            case TokenType.Identifier:
                return {kind: "Identifier", symbol: this.advance().value} as Identifier;
            case TokenType.Number:
                return {
                  kind: "NumericLiteral",
                  value: parseFloat(this.advance().value),
                } as unknown as NumericLiteral;

                case TokenType.OpenParen:
                    this.advance(); 
                    const value = this.parse_expr();
                    this.expect(
                        TokenType.CloseParen, 
                        "Unexpected Token found; expecting ) character.",
                        );
                    return value;

            default:
                console.error("Unexpected token found during parsing!", this.at());
                Deno.exit(1);
                // Trick the compiler for TS
                return {} as Stmt;    
        }
    }
}