#!/bin/bash

if [ -n "$SSH_USER" ] && [ -n "$SSH_PASSWORD" ]; then
    useradd -m -s /bin/bash "$SSH_USER" \
    && echo "$SSH_USER:$SSH_PASSWORD" | chpasswd \
    && adduser "$SSH_USER" sudo \
    && echo "$SSH_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/"$SSH_USER" \
    && chmod 0440 /etc/sudoers.d/"$SSH_USER"
fi

exec /usr/sbin/sshd -D