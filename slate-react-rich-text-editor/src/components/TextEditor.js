import React, {useState, useMemo} from 'react';
import isHotkey from 'is-hotkey';
import {Slate, Editable, withReact, useSlate} from 'slate-react';
import {createEditor, Transforms, Editor, Text} from 'slate';
import { useCallback } from 'react';
import {FaQuoteRight, FaBold, FaItalic, FaUnderline, FaCode, FaListOl, FaListUl} from 'react-icons/fa';
import {MdLooksOne, MdLooksTwo} from 'react-icons/md';
import { cx, css } from 'emotion';

const HOTKEYS = {
    'mod+b': 'bold',
    'mod+i': 'italic',
    'mod+u': 'underline',
    'mod+`': 'code',
  }

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

const CustomEditor = {
    isBoldMarkActive(editor){
        const [match] = Editor.nodes(editor, {
            match: n => n.bold === true,
            universal: true,
        })
        return !!match
    },
    isBlockActive(editor, format){
        const [match] = Editor.nodes(editor, {
          match: n => n.type === format,
        })
      
        return !!match
      },
    isCodeBlockActive(editor){
        const [match] = Editor.nodes(editor, {
            match: n => n.type === 'code',
        })
        return !!match
    },
    isItalicMarkActive(editor){
        const [match] = Editor.nodes(editor, {
            match: n => n.italic === true,
            universal: true,
        })
        return !!match
    },
    isUnderlineMarkActive(editor){
        const [match] = Editor.nodes(editor, {
            match: n => n.underline === true,
            universal: true,
        })
        return !!match
    },
    isMarkActive(editor, format){
        const marks = Editor.marks(editor)
        return marks ? marks[format] === true : false
      },
    toggleBoldMark(editor){
        const isActive = CustomEditor.isBoldMarkActive(editor)
        Transforms.setNodes(
            editor,
            {bold: isActive ? null : true},
            {match: n => Text.isText(n), split: true}
        ) 
    },
    toggleCodeBlock(editor){
        const isActive = CustomEditor.isCodeBlockActive(editor)
        Transforms.setNodes(
            editor,
            {type: isActive ? null : 'code'},
            {match: n => Editor.isBlock(editor, n)}
        )
    },
    toggleItalicMark(editor){
        const isActive = CustomEditor.isItalicMarkActive(editor)
        Transforms.setNodes(
            editor,
            {italic: isActive ? null : true},
            {match: n => Text.isText(n), split: true}
        ) 
    },
    toggleUnderlineMark(editor){
        const isActive = CustomEditor.isUnderlineMarkActive(editor)
        Transforms.setNodes(
            editor,
            {underline: isActive ? null : true},
            {match: n => Text.isText(n), split: true}
        ) 
    },
    toggleMark(editor, format){
        const isActive = CustomEditor.isMarkActive(editor, format)
      
        if (isActive) {
          Editor.removeMark(editor, format)
        } else {
          Editor.addMark(editor, format, true)
        }
      },
      toggleBlock(editor, format){
        const isActive = CustomEditor.isBlockActive(editor, format)
        const isList = LIST_TYPES.includes(format)
      
        Transforms.unwrapNodes(editor, {
          match: n => LIST_TYPES.includes(n.type),
          split: true,
        })
      
        Transforms.setNodes(editor, {
          type: isActive ? 'paragraph' : isList ? 'list-item' : format,
        })
      
        if (!isActive && isList) {
          const block = { type: format, children: [] }
          Transforms.wrapNodes(editor, block)
        }
      }
    
}


export default function TextEditor(){

    const editor = useMemo(()=>withReact(createEditor()), []);
    
    const [value, setValue] = useState(
        JSON.parse(localStorage.getItem('content')) || [
        {
            type: 'paragraph',
            children: [{text: 'a line of a text in paragraph'}]
        }
    ]);

    
    const renderElement = useCallback(props => {
        return <Element {...props}/>
    }, []);

    const renderLeaf = useCallback(props =>{
        return <Leaf {...props}/>
    }, []);
    
    return (
        <Slate 
            editor={editor}
            value={value}
            onChange={value =>
                {setValue(value)
                const content = JSON.stringify(value)
                localStorage.setItem('content', content)
                }}>
            <Toolbar>
                <MarkButton format="bold" icon={<FaBold/>} />
                <MarkButton format="italic" icon={<FaItalic/>} />
                <MarkButton format="underline" icon={<FaUnderline/>} />
                <MarkButton format="code" icon={<FaCode/>} />
                <BlockButton format="heading-one" icon={<MdLooksOne/>} />
                <BlockButton format="heading-two" icon={<MdLooksTwo/>} />
                <BlockButton format="block-quote" icon={<FaQuoteRight/>} />
                <BlockButton format="numbered-list" icon={<FaListOl/>} />
                <BlockButton format="bulleted-list" icon={<FaListUl/>} />
            </Toolbar>
            
            <Editable 
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder="Enter some text here..."
                onKeyDown={event => {
                    for (const hotkey in HOTKEYS) {
                        if (isHotkey(hotkey, event)) {
                          event.preventDefault()
                          const mark = HOTKEYS[hotkey]
                          CustomEditor.toggleMark(editor, mark)
                        }
                      }
                    }}
                />
        </Slate>
    )
}
    
    const Element = ({attributes, children, element}) =>{
        switch (element.type){
            case 'block-quote':
                return <blockquote {...attributes} style={{color: '#777', backgroundColor: '#EEE'}}>{children}</blockquote>
            case 'bulleted-list':
                return <ul {...attributes}>{children}</ul>
            case 'heading-one':
                return <h1 {...attributes}>{children}</h1>
            case 'heading-two':
                return <h2 {...attributes} style={{color: '#555'}}>{children}</h2>
            case 'list-item':
                return <li {...attributes}>{children}</li>
            case 'numbered-list':
                return <ol {...attributes}>{children}</ol>
            case 'code':
                return <code {...attributes} style={{backgroundColor: '#'}}>{children}</code>
            default:
                return <p {...attributes}>{children}</p>
        }
    }


    const Leaf = ({attributes, children, leaf}) => {
        if (leaf.bold){
            children=<strong>{children}</strong>
        }
        if (leaf.code){
            children=<code>{children}</code>
        }
        if (leaf.italic){
            children=<em>{children}</em>
        }
        if (leaf.underline){
            children=<u>{children}</u>
        }
        return <span {...attributes}>{children}</span>
    }

    const BlockButton = ({ format, icon }) => {
        const editor = useSlate()
        return (
          <Button
            active={CustomEditor.isBlockActive(editor, format)}
            onMouseDown={event => {
              event.preventDefault()
              CustomEditor.toggleBlock(editor, format)
            }}
          >
            <icon>{icon}</icon>
          </Button>
        )
      }
      
      const MarkButton = ({ format, icon }) => {
        const editor = useSlate()
        return (
          <Button
            active={CustomEditor.isMarkActive(editor, format)}
            onMouseDown={event => {
              event.preventDefault()
              CustomEditor.toggleMark(editor, format)
            }}
          >
            <icon>{icon}</icon>
          </Button>
        )
      }

      const Menu = React.forwardRef(({ className, ...props }, ref) => (
        <div
          {...props}
          ref={ref}
          className={cx(
            className,
            css`
              & > * {
                display: inline-block;
              }
              & > * + * {
                margin-left: 15px;
              }
            `
          )}
        />
      ))

      const Toolbar = React.forwardRef(({ className, ...props }, ref) => (
        <Menu
          {...props}
          ref={ref}
          className={cx(
            className,
            css`
              position: relative;
              padding: 1px 18px 17px;
              margin: 0 -20px;
              border-bottom: 2px solid #eee;
              margin-bottom: 20px;
            `
          )}
        />
      ))

      export const Button = React.forwardRef(
        ({ className, active, reversed, ...props }, ref) => (
          <span
            {...props}
            ref={ref}
            className={cx(
              className,
              css`
                cursor: pointer;
                color: ${reversed
                  ? active
                    ? 'white'
                    : '#aaa'
                  : active
                  ? 'black'
                  : '#ccc'};
              `
            )}
          />
        )
      )

    
