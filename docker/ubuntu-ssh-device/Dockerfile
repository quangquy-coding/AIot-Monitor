FROM ubuntu:22.04

# Install OpenSSH Server and other utilities
RUN apt-get update && apt-get install -y \
    openssh-server \
    net-tools \
    iputils-ping \
    curl \
    nano \
    vim \
    sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure SSH
RUN mkdir /var/run/sshd
RUN echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config
RUN echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

# Create a script to set up the SSH user
RUN echo '#!/bin/bash \n\
if [ -n "$SSH_USER" ] && [ -n "$SSH_PASSWORD" ]; then \
    useradd -m -s /bin/bash "$SSH_USER" \
    && echo "$SSH_USER:$SSH_PASSWORD" | chpasswd \
    && adduser "$SSH_USER" sudo \
    && echo "$SSH_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/"$SSH_USER" \
    && chmod 0440 /etc/sudoers.d/"$SSH_USER" \
fi \
exec /usr/sbin/sshd -D \
' > /entrypoint.sh

RUN chmod +x /entrypoint.sh

# Expose SSH port
EXPOSE 22

# Start SSH server
ENTRYPOINT ["/entrypoint.sh"]
